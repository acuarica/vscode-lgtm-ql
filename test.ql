//#lang=java
//#projectKeys=[1860774854,1878170062,30360001,1791770031]
//#projectKeys=[39700035,46050017]

import java
import semmle.code.java.controlflow.Guards
import semmle.code.java.dataflow.DefUse

bindingset[suffix]
string getAClass(Top obs, string suffix) {
  exists (string qlclass | qlclass = obs.getAQlClass() and
    qlclass.suffix(qlclass.length() - suffix.length()) = suffix and
    result = qlclass.prefix(qlclass.length() - suffix.length())
  )
}

abstract class Category extends Top { }
abstract class Pattern extends Top { }
abstract class Tag extends Top { }

class MethodCategory extends Category, EqualsMethod { }
class AnyMethodPattern extends Pattern, EqualsMethod { }
class AnyMethodTag extends Tag, EqualsMethod { }

class CastCategory extends Category, CastExpr { }
class AnyCastPattern extends Pattern, CastExpr { }
class AnyCastTag extends Tag, CastExpr { }

string getCategory(Category obs) {
  result = getAClass(obs, "Category")
}

from Top obs select
  getCategory(obs),
  concat("🌀" + getAClass(obs.(Pattern), getCategory(obs) + "Pattern"), "|"),
  concat("🏷" + getAClass(obs.(Tag), getCategory(obs) + "Tag"), "|"),
  obs

module lang {

  class GetClassMethodAccess extends MethodAccess {
    GetClassMethodAccess() {
      getMethod().getName() = "getClass" and
      getMethod().getNumberOfParameters() = 0 and
      getMethod().getReturnType() instanceof TypeClass and
      getMethod().getDeclaringType() instanceof TypeObject
    }
  }

  class MaybeGeneratedCompilationUnit extends CompilationUnit {
    string path;
    MaybeGeneratedCompilationUnit() {
      path = getCompilationUnit().getFile().getRelativePath() and
      not path.matches("%/src/%") and
      (
        path.matches("%/build/tmp/%") or
        path.matches("%/build/generated/%/debug/%") or
        path.matches("%/build/generated/%/release/%")
      )
    }
  }

  /**
   * Based on rule taken from:
   * 
   * https://lgtm.com/rules/910065/
   */
  class NestedChainedIofStmt extends IfStmt {
    int n;
    NestedChainedIofStmt() {
      exists(int rest | (
          if getElse() instanceof IfStmt
          then rest = getElse().(NestedChainedIofStmt).getNumberOfIof()
          else rest = 0
        ) and (
          if getCondition() instanceof InstanceOfExpr
          then n = 1 + rest
          else n = rest
        )
      )
    }

    int getNumberOfIof() {
      result = n
    }

    InstanceOfExpr getIof() {
      result = getCondition()
    }
  }

  class ChainedIofStmt extends NestedChainedIofStmt {
    ChainedIofStmt() {
      n >= 2 and
      not exists(IfStmt other | this = other.getElse())
    }

    InstanceOfExpr getAnIof() {
      result = getElse*().(NestedChainedIofStmt).getIof()
    }
  }

}

module showable {

  class ShowableRefType extends RefType {

    private string isParam() { if
      this instanceof ParameterizedType
      then result = "@Param|" else result = ""
    }

    override string toString() {
      result = isParam() + super.toString()
    } 
  }

  class ShowableArray extends Array {
    Array a;
    ShowableArray() {
      a = this
    }
    override string toString() {
      result = super.toString() + a.getComponentType() + a.getDimension() + a.getElementType()
    }
  }

  class ShowableCastExpr extends CastExpr {
    override string toString() {
      result =
      inOverride() +
      inTest() +
      inEquals() +
      inClone() +
      inGenerated() + 
      "(" + getTypeExpr() + ")" + getExpr()
    }

    private string inOverride() { if
      getEnclosingCallable().(Method).overrides(_)
      then result = "@Override " else result = ""
    }

    private string inTest() { if
      getEnclosingCallable() instanceof TestMethod
      then result = "@Test " else result = ""
    }

    private string inEquals() { if
      getEnclosingCallable() instanceof EqualsMethod
      then result = "@Equals " else result = ""
    }

    private string inClone() { if
      getEnclosingCallable() instanceof CloneMethod
      then result = "@Clone " else result = ""
    }

    private string inGenerated() { if
      getEnclosingCallable() instanceof GeneratedCallable
      then result = "@Generated " else result = ""
    }

  }

  class ShowableMethodAccess extends MethodAccess {
    override string toString() {
      result = showQualifier() + getMethod()
    }

    private string showQualifier() {
      if hasQualifier()
      then result = "*."
      else result = ""
    }
  }

  class ShowableMethod extends Method {
    override string toString() {
      result = getName() + ":" + getDeclaringType() + "->" + getSourceDeclReturnType() + getReturnType()
    }

    private string getSourceDeclReturnType() {
      if this != getSourceDeclaration()
      then result = getSourceDeclaration().getReturnType() + "<:"
      else result = ""
    }
  }

}

module methods { 

  module tags {

    class EqualsMethodTag extends AnyMethodTag {
    }

    class MaybeGeneratedMethodTag extends AnyMethodTag {
      MaybeGeneratedMethodTag() {
        getCompilationUnit() instanceof lang::MaybeGeneratedCompilationUnit
      }
    }

    class ForTestMethodTag extends AnyMethodTag {
      ForTestMethodTag() {
        exists (TestMethod tm |
          tm.getCompilationUnit() = getCompilationUnit()
        )
      }
    }

  }

  module patterns {

    class EqualsMethodPattern extends AnyMethodPattern {
      EqualsMethodPattern() {
        exists (casts::patterns::EqualsCastPattern ce | ce.getEnclosingCallable() = this)
      }
    }

  }

}

module casts {

  module tags {

    final class PrimCastTag extends AnyCastTag {
      PrimCastTag() { getExpr().getType() instanceof PrimitiveType } 
    }

    /**
     * Cast when the cast expression casted from is of reference type.
     */
    class RefCastTag extends AnyCastTag {
      RefType exprType;
      RefCastTag() { exprType = getExpr().getType() } 
    }

    /**
     * A cast to the `null` literal.
     */
    final class NullCastTag extends AnyCastTag {
      NullCastTag() {
        getExpr().getType() instanceof NullType
      }
    }

    /**
     * A cast applied to an expression of type `java.lang.Object`.
     */
    final class ObjectCastTag extends RefCastTag {
      ObjectCastTag() { exprType instanceof TypeObject }
    }

    /**
     * A cast applied to an expression whose type is a subclass of
     * `java.lang.Object`.
     * 
     * @see ObjectCastTag
     */
    class FamilyCastTag extends RefCastTag {
      FamilyCastTag() {
        exprType.getASupertype+() instanceof TypeObject
      }
    }

    class ClassFamilyCastTag extends AnyCastTag {
      ClassFamilyCastTag() {
        exists (MethodAccess ma, RefType rt |
          getExpr() = ma and not ma.getMethod().isStatic() and
          rt = ma.getMethod().getReturnType() and rt.isAbstract()
        )
      }
    }

    class ToThistypeCastTag extends AnyCastTag {
      ToThistypeCastTag() {
        getTypeExpr().getType() = getEnclosingCallable().getDeclaringType()
      }
    }

    class ToSupertypeCastTag extends AnyCastTag {
      ToSupertypeCastTag() {
        getTypeExpr().getType() = getEnclosingCallable().getDeclaringType().getASupertype+()
      }
    }

    class ToSubtypeCastTag extends AnyCastTag {
      ToSubtypeCastTag() {
        getTypeExpr().getType() = getEnclosingCallable().getDeclaringType().getASubtype+()
      }
    }

    /**
    * A cast to a variable.
    * That is, the expression of the cast is a variable.
    * Variable here is treated in the general sense,
    * it can be a field (class or instance variable), a local variable or
    * a parameter in the enclosing callable.
    */
    class VarCastTag extends AnyCastTag {
      Variable var;
      VarCastTag() {
        var.getAnAccess() = getExpr() 
      }
    }

    final class FieldCastTag extends VarCastTag {
      FieldCastTag() { var instanceof Field }
    }

    final class LocalVarCastTag extends VarCastTag {
      LocalVarCastTag() { var instanceof LocalVariableDecl }
    }

    class ParamCastTag extends VarCastTag {
      ParamCastTag() { var instanceof Parameter }
    }

    class DefUseCastTag extends VarCastTag {
      // override string getTag() {
      //   result = super.getTag() or
      //   result = "->"+def.getSource()
      // }
      VariableAssign def;
      DefUseCastTag() {
        defUsePair(def, var.getAnAccess()) and
        def.getSource() instanceof MethodAccess
      }
    }

    class VarControlByIofCastTag extends VarCastTag {
      InstanceOfExpr ioe;
      VarControlByIofCastTag() {
        exists (ConditionBlock cb |
          ioe = cb.getCondition() and
          cb.controls(getBasicBlock(), true) and
          var.getAnAccess() = ioe.getExpr()
        )
      }
    }

    /**
    * A cast to a variable guarded by an `instanceof`.
    * A variable is /guarded/ by a condition when the condition controls
    * that access to the variable, and there is no assignment after the
    * condition and before the access to that variable.
    *
    * https://lgtm.com/projects/g/mockito/mockito/snapshot/baef2cf2d84c9ef72f9446a0a49b7d4fe627762e/files/src/main/java/org/mockito/internal/InOrderImpl.java?sort=name&dir=ASC&mode=heatmap&showExcluded=false#L55
    */
    final class VarGuardedByIofCastTag extends VarControlByIofCastTag {
      VarGuardedByIofCastTag() {
        forall (VariableUpdate def | defUsePair(def, getExpr()) |
          defUsePair(def, ioe.getExpr())
        )
      }
    }

    class TypecaseCastTag extends VarControlByIofCastTag {
      TypecaseCastTag() {
        exists (lang::ChainedIofStmt ciof | ciof.getAnIof() = ioe)
      }
    }

    final class VariableGuardedByVarIofCastTag extends RefCastTag {
      VariableGuardedByVarIofCastTag() {
        exists (ConditionBlock cb, InstanceOfExpr ioe, VariableAssign def |
          def.getDestVar().getAnAccess() = cb.getCondition() and
          def.getSource() = ioe and
          cb.controls(getBasicBlock(), _) and
          exists (LocalVariableDecl v |
            v.getAnAccess() = getExpr() and
            v.getAnAccess() = ioe.getExpr()
          )
        )
      }
    }

    final class VarGuardedByGetClassCastTag extends VarCastTag {
      VarGuardedByGetClassCastTag() {
        exists (lang::GetClassMethodAccess tma, lang::GetClassMethodAccess oma, EqualityTest eqe, MethodAccess ema, ConditionBlock cb |
          tma.isOwnMethodAccess() and
          oma.getQualifier() = var.getAnAccess() and
          (
          (
            eqe.hasOperands(tma, oma) and eqe = cb.getCondition() and
            (
              (eqe.getOp() = " == " and cb.controls(getBasicBlock(), true) ) or
              (eqe.getOp() = " != " and cb.controls(getBasicBlock(), false) )
            )
          ) or (
            ema.getMethod() instanceof EqualsMethod and ema.getQualifier() = tma and ema.getArgument(0) = oma and
            (
              (ema = cb.getCondition() and cb.controls(getBasicBlock(), true) ) //or
              // (exists (LogNotExpr neg | neg.getExpr() = ema and neg = cb.getCondition()) and cb.controls(getBasicBlock(), false) )
            )
          )
          )
        )
      }
    }

    final class OwnFieldGuardedByIofCastTag extends RefCastTag {
      OwnFieldGuardedByIofCastTag() {
        exists (ConditionBlock cb, InstanceOfExpr ioe |
          ioe = cb.getCondition() and
          cb.controls(getBasicBlock(), true) and
          getExpr().(FieldAccess).isOwnFieldAccess() and
          exists (Field f |
            f.getAnAccess() = getExpr() and
            f.getAnAccess() = ioe.getExpr()
          )
        )
      }
    }

    final class GuardedByTagCastTag extends RefCastTag {
      GuardedByTagCastTag() {
        exists (Parameter p, SwitchStmt ss |
          p.getAnAccess() = getExpr().(FieldAccess).getQualifier() and
          p.getAnAccess() = ss.getExpr().(FieldAccess).getQualifier() and
          getEnclosingStmt() = ss.getAChild*()
        )
      }
    }

    final class ArrayGuardedByTagCastTag extends RefCastTag {
      ArrayGuardedByTagCastTag() {
        exists (ArrayAccess aa, VariableAssign def |
          aa = getExpr() and
          defUsePair(def, aa.getArray()) and
          def.getSource() instanceof GuardedByTagCastTag
        )
      }
    }

    final class OverloadCastTag extends AnyCastTag {
      OverloadCastTag() {
        exists (Callable c | 
          c = getParent().(Call).getCallee() and
          count (Callable other |
            other = c.getDeclaringType().getACallable() and
            other.getName() = c.getName() and c != other
          ) > 0
        )
      }
    }

    final class VarargsCastTag extends AnyCastTag {
      VarargsCastTag() {
        this.(Argument).isExplicitVarargsArray()
      }
    }

    class MethodAccessCastTag extends RefCastTag {
      MethodAccess methodAccess;
      Method method;
      string declTypeName;
      MethodAccessCastTag() {
        methodAccess = getExpr() and
        method = methodAccess.getMethod() and
        declTypeName = method.getDeclaringType().getQualifiedName()
      }
    }

    class InOverrideCastTag extends AnyCastTag {
      InOverrideCastTag() { getEnclosingCallable().(Method).overrides(_) }
    }

    class InEqualsCastTag extends InOverrideCastTag {
      InEqualsCastTag() { getEnclosingCallable() instanceof EqualsMethod }
    }

    class InCloneCastTag extends InOverrideCastTag {
      InCloneCastTag() { getEnclosingCallable() instanceof CloneMethod }
    }

    class InTestCastTag extends AnyCastTag {
      InTestCastTag() { getEnclosingCallable() instanceof TestMethod }
    }

    class InGeneratedCastTag extends AnyCastTag {
      InGeneratedCastTag() { getEnclosingCallable() instanceof GeneratedCallable }
    }

    class InMaybeGeneratedCastTag extends AnyCastTag {
      InMaybeGeneratedCastTag () { getCompilationUnit() instanceof lang::MaybeGeneratedCompilationUnit }
    }

    class CloneCastTag extends MethodAccessCastTag {
      CloneCastTag() { method instanceof CloneMethod }
    }

    class RemovedGenericTypeCastTag extends MethodAccessCastTag {
      RemovedGenericTypeCastTag() { method != method.getSourceDeclaration() }
    }

    class NewInstanceCastTag extends MethodAccessCastTag {
      NewInstanceCastTag() {
        method.getName() = "newInstance" and
        (
          declTypeName = "java.lang.Class<?>" or
          declTypeName = "java.lang.reflect.Array" or
          declTypeName = "java.lang.reflect.Constructor<?>"
        )
      }
    }

    class NewProxyInstanceCastTag extends MethodAccessCastTag {
      NewProxyInstanceCastTag() {
        method.getName() = "newProxyInstance" and
        declTypeName = "java.lang.reflect.Proxy"
      }
    }

    class LookupByIdCastTag extends MethodAccessCastTag {
      LookupByIdCastTag() {
        exists (FieldAccess fa |
          not method.isStatic() and not method.isVarargs() and
          method.isPublic() and
          method.getNumberOfParameters() = 1 and
          method.getParameterType(0).getTypeDescriptor() = "Ljava/lang/String;" and
          method.getReturnType().getTypeDescriptor() = "Ljava/lang/Object;" and
          methodAccess.getArgument(0).getType().getTypeDescriptor() = "Ljava/lang/String;" and
          methodAccess.getArgument(0) = fa and
          fa.getField().isFinal() and fa.getField().isStatic() and
          fa.getField().getType().getTypeDescriptor() = "Ljava/lang/String;"
        )
      }
    }

    class ReflectionFieldCastTag extends MethodAccessCastTag {
      ReflectionFieldCastTag() {
        declTypeName = "java.lang.reflect.Field" and
        method.getName() = "get" and
        method.getNumberOfParameters() = 1 and
        method.getParameterType(0) instanceof TypeObject
      }
    }

    class ReflectionMethodInvokeCastTag extends MethodAccessCastTag {
      ReflectionMethodInvokeCastTag() {
        declTypeName = "java.lang.reflect.Method" and
        method.getName() = "invoke"
      }
    }

    class ReadObjectCastTag extends MethodAccessCastTag {
      ReadObjectCastTag() { method instanceof ReadObjectMethod }
    }

    class FindViewByIdCastTag extends MethodAccessCastTag {
      FindViewByIdCastTag() {
          (declTypeName = "android.view.View" or declTypeName= "android.app.Activity") and
          method.getName() = "findViewById" and
          method.getNumberOfParameters() = 1 and
          method.getParameterType(0).getName() = "int" and
          methodAccess.getArgument(0).isCompileTimeConstant()
      }
    }

    class SerializableExtraCastTag extends MethodAccessCastTag {
      SerializableExtraCastTag() {
        method.getName() = "getSerializableExtra" and
        declTypeName = "android.content.Intent"
      }
    }

    class GenerateCertificateCastTag extends MethodAccessCastTag {
      GenerateCertificateCastTag() {
        method.getName() = "generateCertificate" and
        declTypeName = "java.security.cert.CertificateFactory"
      }
    }

    class RawIteratorLoopCastTag extends MethodAccessCastTag {
      private RefType rt;
      RawIteratorLoopCastTag() {
        exists (LoopStmt loop |
          rt = methodAccess.getQualifier().getType() and
          declTypeName = "java.util.Iterator<>" and
          method.getName() = "next" and
          loop.getAChild*() = getEnclosingStmt()
        )
      }
    }

    class UrlOpenConnectionCastTag extends MethodAccessCastTag {
      UrlOpenConnectionCastTag() {
        declTypeName = "java.net.URL" and
        method.getName() = "openConnection"
      }
    }

    class ThrowableGetCauseCastTag extends MethodAccessCastTag {
      ThrowableGetCauseCastTag() {
        declTypeName = "java.lang.Throwable" and
        method.getName() = "getCause"
      }
    }

    class GetLoggerMethodCastTag extends MethodAccessCastTag {
      GetLoggerMethodCastTag() {
        method.getName() = "getLogger"
      }
    }

    class CovariantReturnCastTag extends AnyCastTag {
      CovariantReturnCastTag() {
        exists (RefType rt, Method m, VirtualMethodAccess vma |
          getType() = rt and
          getEnclosingCallable() = m and m.overrides(_) and getExpr() = vma  and vma.isOwnMethodAccess()
        )
      }
    }

    class SelfcastCastTag extends AnyCastTag {
      SelfcastCastTag() {
        getExpr().getType() = getTypeExpr().getType()
      }
    }

    class UpcastCastTag extends AnyCastTag {
      UpcastCastTag() {
        getExpr().getType().(RefType).getASupertype+() = getTypeExpr().getType()
      }
    }

    class ThisCastTag extends AnyCastTag {
      ThisCastTag() {
        getExpr() instanceof ThisAccess
      }
    }

    class IofMethodCastTag extends AnyCastTag {
      IofMethodCastTag() {
        exists (MethodAccess x, MethodAccess y, InstanceOfExpr ioe |
          ioe.getExpr() = x and getExpr() = y and x.getMethod() = y.getMethod() and x.getQualifier() = y.getQualifier()
        )
      }
    }

    class IofArrayCastTag extends AnyCastTag {
      IofArrayCastTag() {
        exists (ArrayAccess x, ArrayAccess y, InstanceOfExpr ioe |
          ioe.getExpr() = x and getExpr() = y and x.getArray() = y.getArray() and x.getIndexExpr() = y.getIndexExpr()
        )
      }
    }

    class GetClassIsArrayGuardedCastTag extends AnyCastTag {
      GetClassIsArrayGuardedCastTag() {
        exists (ConditionBlock cb, MethodAccess iama |
          cb.getCondition() = iama and
          iama.getMethod().getName() = "isArray" and
          iama.getMethod().getNumberOfParameters() = 0 and
          iama.getQualifier().getType() instanceof TypeClass and
          cb.controls(getBasicBlock(), true)
        )
      }
    }

    class UnionGuardedCastTag extends AnyCastTag {
      UnionGuardedCastTag() {
        count(ConditionBlock cb, InstanceOfExpr ioe |
          ioe = cb.getCondition() and
          cb.getTestSuccessor(true) = getBasicBlock()
        ) > 1
      }
    }

    class TypeParameterCastTag extends AnyCastTag {
      TypeParameterCastTag() {
        getTypeExpr().getType() instanceof GenericType
      }
    }

    class OverridingCloneCastTag extends AnyCastTag {
      OverridingCloneCastTag() {
        exists (CloneMethod cm, SuperMethodAccess sma, CloneMethod cma |
          getEnclosingCallable() = cm and
          getExpr() = sma and
          sma.getMethod() = cma
        )
      }
    }

    class ExceptionForRethrowCastTag extends AnyCastTag {
      ExceptionForRethrowCastTag() {
        exists (CatchClause cc | cc.getAChild*() = getEnclosingStmt() )
      }
    }

    class ObjectInCollectionCastTag extends AnyCastTag {
      ObjectInCollectionCastTag() {
        exists (MethodAccess ma, RawType rt | getExpr() = ma and ma.getQualifier().getType() = rt)
      }
    }

    class RedundantCastTag extends AnyCastTag {
      RedundantCastTag() {
        exists (InstanceOfExpr ioe, RefType t, RefType ct, ConditionBlock cb |
          t = ioe.getExpr().getType() and
          ct = ioe.getTypeName().getType() and
          ct = t.getASupertype+() and
          ioe = cb.getCondition() and
          cb.controls(getBasicBlock(), true)
      )
      }
    }

    class RemoveTypeParameterCastTag extends AnyCastTag {
      RemoveTypeParameterCastTag() {
        exists (RawType rt | getTypeExpr().getType() = rt)
      }
    }

    class SearchOrFilterByTypeCastTag extends AnyCastTag {
      SearchOrFilterByTypeCastTag() {
        this instanceof RefCastTag and exists (LoopStmt ls | ls.getAChild*() = getEnclosingStmt())
      }
    }

    class StashCastTag extends AnyCastTag {
      StashCastTag() {
        getExpr().(FieldAccess).isOwnFieldAccess()
      }
    }

    class TypeParameterResolutionCastTag extends AnyCastTag {
      TypeParameterResolutionCastTag() {
        getType() instanceof TypeClass
      }
    }

    class ParameterizedCastTag extends AnyCastTag {
      ParameterizedCastTag() {
        getTypeExpr().getType() instanceof ParameterizedType
      }
    }

    class GenericTypeCastTag extends AnyCastTag {
      GenericTypeCastTag() {
        getTypeExpr().getType() instanceof GenericType
      }
    }

    class BoundedTypeCastTag extends AnyCastTag {
      BoundedTypeCastTag() {
        getTypeExpr().getType() instanceof BoundedType
      }
    }

    class TypeVariableCastTag extends BoundedTypeCastTag {
      TypeVariableCastTag() {
        getTypeExpr().getType() instanceof TypeVariable
      }
    }

    class WildcardCastTag extends BoundedTypeCastTag {
      WildcardCastTag() {
        getTypeExpr().getType() instanceof Wildcard
      }
    }

  }

  module patterns {

    import tags

    /**
     * A cast applied to an expression whose type is a primitive type.
     * In other words, the cast is applied to a primitive value.
     * Primitives types as defined by the \java{} Language Specification[1] are:
     * `boolean`, `char`, `byte`, `short`, `int`, `long`, `float`, and `double`.
     *
     * Note that only primitive types are included here.
     * Boxed types are excluded from this tag, as they can be part of
     * a pattern, and therefore may be of interest.
     *
     * @instances
     *
     * The following example[2] shows a conversion cast from `double`
     * (as returned by `Math.ceil`) and converted to an `int`.
     *
     * ```java
     * int iHigh = (int) Math.ceil(rank);
     * ```
     *
     * [1] https://docs.oracle.com/javase/specs/jls/se8/html/index.html
     * [2] https://lgtm.com/projects/g/Netflix/Hystrix/snapshot/1dc0de75766e53c6dacfe2a7639e44775d2f3d32/files/hystrix-core/src/main/java/com/netflix/hystrix/util/HystrixRollingPercentile.java?sort=name&dir=ASC&mode=heatmap&showExcluded=false#L432
     */
    class PrimCastPattern extends AnyCastPattern {
      PrimCastPattern() {
        this instanceof PrimCastTag
      } 
    }

    /**
    * An **Equals** cast pattern is a common pattern to implement the
    * `equals` method.
    * 
    * Example tags:
    * 
    * InEquals|Object|Param|ToThistype|VarGuardedByIof
    * InEquals|Object|Param|ToThistype|VarGuardedByGetClass
    * 
    * Note that the `Object` tag is not declared explicitly in the
    * definition of the pattern.
    * The `InEquals`+`Param` tags imply that the cast is applied to an
    * expression of type `Object`.
    *
    * @cases
    * ### Cases: Using supertype
    * 
    * ```java
    * int a = new Integer(1);
    * ```
    * In this case, the cast type is the supertype of the owner class. 
    *
    * InEquals|Object|Param|ToSupertype|VarGuardedByIof
    *
    * https://lgtm.com/projects/g/square/sqlbrite/snapshot/3a9916985485ba5922097fe59a18230500f02df4/files/sample/build/generated/source/apt/debug/com/example/sqlbrite/todo/ui/$AutoValue_ListsItem.java?sort=name&dir=ASC&mode=heatmap&showExcluded=false#L47
    *
    */
    class EqualsCastPattern extends AnyCastPattern {
      EqualsCastPattern() {
        this instanceof ParamCastTag and
        this instanceof InEqualsCastTag and (
          this instanceof ToThistypeCastTag or
          this instanceof ToSupertypeCastTag
        ) and (
          this instanceof VarGuardedByIofCastTag or
          this instanceof VarGuardedByGetClassCastTag
        )
      }
    }

    /**
     * The **ArgumentCheck** pattern checks that an argument in an override method
     * has a particular type.
     */
    class ArgumentCheckCastPattern extends AnyCastPattern {
      ArgumentCheckCastPattern() {
        this instanceof ParamCastTag and
        this instanceof InOverrideCastTag and 
        this instanceof VarGuardedByIofCastTag and
        (
          this instanceof ObjectCastTag or
          this instanceof FamilyCastTag
        )
      } 
    }

    /**
     * An argument is casted in an override method without checking.
     */
    class ArgumentSpecificCastPattern extends AnyCastPattern {
      ArgumentSpecificCastPattern() {
        this instanceof ParamCastTag and
        this instanceof InOverrideCastTag and 
        not this instanceof VarControlByIofCastTag and
        this instanceof FamilyCastTag
      } 
    }

    /**
     * This pattern is used to extract stashed values from a generic
     * container.
     */
    class LookupByIdCastPattern extends AnyCastPattern {
      LookupByIdCastPattern() {
        this instanceof LookupByIdCastTag
      }
    }

    /**
     * A selection cast pattern is done to select the appropiate version
     * of an overloaded method.
     */
    class SelectionCastPattern extends AnyCastPattern {
      SelectionCastPattern() {
        this instanceof NullCastTag and
        this instanceof OverloadCastTag
      }
    }

    class TypeTagCastPattern extends AnyCastPattern {
      TypeTagCastPattern() {
        this instanceof GuardedByTagCastTag or
        this instanceof ArrayGuardedByTagCastTag
      }
    }

    /**
     * Dynamically creation of object by means of reflection.
     * These are the casts that can not be avoidable.
     */
    class DynamicCreationCastPattern extends AnyCastPattern {
      DynamicCreationCastPattern() {
        this instanceof NewInstanceCastTag
      }
    }

    /**
     * This pattern accesses a field of an object by means of reflection.
     * It uses reflection because at compile time the field is
     * unaccesible.
     * Usually the method `setAccessible(true)` is invoked on the field
     * before actually getting the value from an object.
     *
     * @cases
     *
     * The following cast[1] uses this pattern 
     *
     * ```java
     * f.setAccessible(true);
     * HttpEntity wrapped = (HttpEntity) f.get(entity);
     * ```
     *
     * [1] https://lgtm.com/projects/g/loopj/android-async-http/snapshot/dist-1879340034-1529316783166/files/library/src/main/java/com/loopj/android/http/AsyncHttpClient.java?sort=name&dir=ASC&mode=heatmap&showExcluded=false#L445
     */
    class ReflectionCastPattern extends AnyCastPattern {
      ReflectionCastPattern() {
        this instanceof ReflectionFieldCastTag
      }
    }

    /**
     * Used to deserialize a byte stream into a known object.
     *
     * Can we avoid this pattern by means of a techniche similar to
     * parser combinators?
     */
    class DeserializationCastPattern extends AnyCastPattern {
      DeserializationCastPattern() {
        this instanceof ReadObjectCastTag
      }
    }

    /**
     * A factory method.
     */
    class FactoryCastPattern extends AnyCastPattern {
      FactoryCastPattern() {
        this instanceof GenerateCertificateCastTag
      }
    }

    /**
     * A cast to a method access to findViewById is a pattern in its
     * own.
     */
    class FindViewByIdCastPattern extends AnyCastPattern {
      FindViewByIdCastPattern() {
        this instanceof FindViewByIdCastTag
      }
    }

    /**
     * It is a guarded cast by `instanceof` in a non-overrided method.
     * 
     * This cast could be avoidable.
     * This pattern could be split in different methods.
     * It does not have to be InOverride.
     */
    class MergedCheckCastPattern extends AnyCastPattern {
      MergedCheckCastPattern() {
        this instanceof VarGuardedByIofCastTag and
        this instanceof ParamCastTag and
        this instanceof ObjectCastTag and
        not this instanceof InOverrideCastTag
      }
    }

    class RemovedGenericTypeCastPattern extends AnyCastPattern {
      RemovedGenericTypeCastPattern() {
        this instanceof RemovedGenericTypeCastTag
      }
    }

    class TypecaseCastPattern extends AnyCastPattern {
      TypecaseCastPattern() {
        this instanceof TypecaseCastTag
      }
    }

  }
}