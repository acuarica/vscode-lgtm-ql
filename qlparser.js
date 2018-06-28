var QL =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	 * This file is packaged up with the antlr4 JavaScript runtime and a parser
	 * lexer for QL to form `target/general/lgtm-lab-antlr4-QL/output/QL.js`.
	 * This single JavaScript file that is produced is then served to the lgtm
	 * client for use for client-side parsing.
	 *
	 * This is designed to model as closely as possible the output of the
	 * equivalent java code for handling antlr parsing errors. This can be
	 * found at and around `com.semmle.frontend.util.antlr.GeneralErrorStrategy`.
	 * Because of these being written in different languages it is hard to share
	 * code unfortunately, so this may become out of date occasionally and
	 * need to be updated.
	 *
	 * The antlr4 JavaScript runtime can be found at:
	 * - https://github.com/antlr/antlr4/tree/master/runtime/JavaScript/src/antlr4
	 * - http://www.antlr.org/download/antlr-javascript-runtime-4.5.zip
	 * - https://www.npmjs.com/package/antlr4
	 *
	 * The runtime and other files needed for packaging are located at
	 * `resources/lib/codingstars/antlr4-javascript-runtime-buildenv.zip`.
	 * Ideally these other files will rarely if ever need to change and
	 * all functionality changes can be accomplished in this file.
	 */

	var antlr4 = __webpack_require__(1);
	var ErrorListener = __webpack_require__(24);
	var Errors = __webpack_require__(26);

	var QLLexer = __webpack_require__(49);
	var QLParser = __webpack_require__(50);
	var QLParserVisitor = __webpack_require__(51);

	// Disable the console error listener
	ErrorListener.ConsoleErrorListener.INSTANCE.syntaxError = function () {};

	function GeneralErrorListener(errorsList) {
	    ErrorListener.ErrorListener.call(this);
	    this.errorsList = errorsList;
	}

	GeneralErrorListener.prototype = Object.create(ErrorListener.ErrorListener.prototype);
	GeneralErrorListener.prototype.constructor = GeneralErrorListener;

	/**
	 * Return a short description of the exception.
	 * Should end in a space and make sense when followed by the offending input.
	 */
	function getMsgProblem(e) {
	    if (e instanceof Errors.NoViableAltException) {
	        return "no viable parse for input ";
	    } else if (e instanceof Errors.LexerNoViableAltException) {
	        return "no viable lex for input ";
	    } else if (e instanceof Errors.InputMismatchException) {
	        return "unexpected input ";
	    } else if (e instanceof Errors.FailedPredicateException) {
	        return "failed predicate for input ";
	    }
	    return "Error parsing input ";
	}

	/**
	 * Return the text between two tokens (inclusive except when start != end and
	 * the end token is EOF in which the EOF is not appended).
	 * Should be pretty robust to bad input, `tokens` and `startToken` may be undefined.
	 */
	function getTextFromTokens(tokens, startToken, endToken) {
	    if (!tokens) {
	        return "<unknown input>";
	    }
	    if (!startToken) {
	        startToken = endToken;
	    }
	    if (startToken.type === antlr4.Token.EOF) {
	        return "<EOF>";
	    }

	    var buf = [];
	    for (var i = startToken.tokenIndex; i < endToken.tokenIndex; ++i) {
	        buf.push(tokens[i].text);
	    }
	    if (endToken.type !== antlr4.Token.EOF) {
	        buf.push(tokens[endToken.tokenIndex].text);
	    }
	    return buf.join("");
	}

	function escapeAndQuote(s) {
	    s = s.replace("\n", "\\n");
	    s = s.replace("\r", "\\r");
	    s = s.replace("\t", "\\t");
	    return "'" + s + "'";
	}

	/**
	 * Return a string listing the tokens that were expected at this point.
	 */
	function getExpectedTokens(e) {
	    var result = e.getExpectedTokens().toString(e.recognizer.literalNames, e.recognizer.symbolicNames);
	    if (result.startsWith("{")) {
	        result = result.substring(1);
	    }
	    return result;
	}

	/**
	 * Return a position from the startToken (inclusive) to endToken (exclusive).
	 * Both tokens must be non-null.
	 */
	function getTokenPosition(startToken, endToken) {
	    return {
	        line: startToken.line,
	        column: startToken.column + 1,
	        endLine: endToken.line,
	        endColumn: endToken.column + 1
	    };
	}

	/**
	 * Return a position describing a single spot with no length.
	 */
	function getRawPosition(line, column) {
	    return {
	        line: line,
	        column: column + 1,
	        endLine: line,
	        endColumn: column + 1
	    };
	}

	/**
	 * Return an error with the given message and position.
	 */
	function makeError(message, position) {
	    return {
	        message: message,
	        severity: "ERROR",
	        libraryError: false,
	        position: position
	    };
	}

	GeneralErrorListener.prototype.syntaxError = function (recognizer, offendingSymbol, line, column, msg, e) {
	    var message;
	    var position;

	    if (e) {
	        var input = getTextFromTokens(e.input.tokens, e.startToken, e.offendingToken);
	        message = getMsgProblem(e) + escapeAndQuote(input) + ", expecting one of : " + getExpectedTokens(e);
	        position = e.startToken && e.offendingToken ? getTokenPosition(e.startToken, e.offendingToken) : getRawPosition(line, column);
	    } else {
	        message = msg;
	        position = getRawPosition(line, column);
	    }

	    this.errorsList.push(makeError(message, position));
	};

	/**
	 * Define a visitor that checks that a script only contains
	 * at most one query (a.k.a. select clause) and doesn't
	 * contain any query predicates.
	 * Any errors are appended to the given list.
	 */
	function MultipleQueriesVisitor(errorsList) {
	    QLParserVisitor.QLParserVisitor.call(this);
	    this.errorsList = errorsList;
	    return this;
	}

	MultipleQueriesVisitor.prototype = Object.create(QLParserVisitor.QLParserVisitor.prototype);
	MultipleQueriesVisitor.prototype.constructor = MultipleQueriesVisitor;

	/** Visit an annotation */
	MultipleQueriesVisitor.prototype.visitSimpleAnnotation = function (ctx) {
	    if (ctx.start.text === 'query') {
	        var message = "Query predicates are not supported";
	        var position = {
	            line: ctx.start.line,
	            // +1 because of going from 0-indexing to 1-indexing
	            column: ctx.start.column + 1,
	            // a token can not span multiple lines
	            endLine: ctx.start.line,
	            // +1 because of going from 0-indexing to 1-indexing,
	            // and another +1 because of going from an inclusive to an exclusive end point.
	            endColumn: ctx.start.column + ctx.start.stop - ctx.start.start + 2
	        };
	        this.errorsList.push(makeError(message, position));
	    }
	};

	// TODO: remove once Antlr's generated visitor doesn't break
	// See https://github.com/antlr/antlr4/pull/2196
	MultipleQueriesVisitor.prototype.visitChildren = function (ctx) {
	    if (ctx.children) {
	        return this.visit(ctx.children);
	    }
	};

	function parse(input) {
	    var chars = new antlr4.InputStream(input);
	    var lexer = new QLLexer.QLLexer(chars);
	    var tokens = new antlr4.CommonTokenStream(lexer);
	    var parser = new QLParser.QLParser(tokens);

	    var errors = [];
	    parser.addErrorListener(new GeneralErrorListener(errors));

	    // This function actually does the parsing.
	    // "script" is the name of the root rule.
	    // Also store the output as it's important that
	    // parser.script() is only called once.
	    var tree = parser.script();

	    if (errors.length === 0) {
	        // TODO: remove once multiple queries are supported
	        // This function adds errors if there are multiple
	        // select statements or any query predicates.
	        new MultipleQueriesVisitor(errors).visitFileModule(tree);
	    }

	    return errors;
	}

	module.exports = { 'parse': parse };

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	exports.atn = __webpack_require__(2);
	exports.codepointat = __webpack_require__(33);
	exports.dfa = __webpack_require__(34);
	exports.fromcodepoint = __webpack_require__(37);
	exports.tree = __webpack_require__(38);
	exports.error = __webpack_require__(39);
	exports.Token = __webpack_require__(6).Token;
	exports.CharStreams = __webpack_require__(42).CharStreams;
	exports.CommonToken = __webpack_require__(6).CommonToken;
	exports.InputStream = __webpack_require__(43).InputStream;
	exports.FileStream = __webpack_require__(45).FileStream;
	exports.CommonTokenStream = __webpack_require__(46).CommonTokenStream;
	exports.Lexer = __webpack_require__(22).Lexer;
	exports.Parser = __webpack_require__(48).Parser;
	var pc = __webpack_require__(12);
	exports.PredictionContextCache = pc.PredictionContextCache;
	exports.ParserRuleContext = __webpack_require__(16).ParserRuleContext;
	exports.Interval = __webpack_require__(10).Interval;
	exports.Utils = __webpack_require__(5);

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	exports.ATN = __webpack_require__(3).ATN;
	exports.ATNDeserializer = __webpack_require__(17).ATNDeserializer;
	exports.LexerATNSimulator = __webpack_require__(21).LexerATNSimulator;
	exports.ParserATNSimulator = __webpack_require__(31).ParserATNSimulator;
	exports.PredictionMode = __webpack_require__(32).PredictionMode;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	var LL1Analyzer = __webpack_require__(4).LL1Analyzer;
	var IntervalSet = __webpack_require__(10).IntervalSet;

	function ATN(grammarType, maxTokenType) {

	    // Used for runtime deserialization of ATNs from strings///
	    // The type of the ATN.
	    this.grammarType = grammarType;
	    // The maximum value for any symbol recognized by a transition in the ATN.
	    this.maxTokenType = maxTokenType;
	    this.states = [];
	    // Each subrule/rule is a decision point and we must track them so we
	    //  can go back later and build DFA predictors for them.  This includes
	    //  all the rules, subrules, optional blocks, ()+, ()* etc...
	    this.decisionToState = [];
	    // Maps from rule index to starting state number.
	    this.ruleToStartState = [];
	    // Maps from rule index to stop state number.
	    this.ruleToStopState = null;
	    this.modeNameToStartState = {};
	    // For lexer ATNs, this maps the rule index to the resulting token type.
	    // For parser ATNs, this maps the rule index to the generated bypass token
	    // type if the
	    // {@link ATNDeserializationOptions//isGenerateRuleBypassTransitions}
	    // deserialization option was specified; otherwise, this is {@code null}.
	    this.ruleToTokenType = null;
	    // For lexer ATNs, this is an array of {@link LexerAction} objects which may
	    // be referenced by action transitions in the ATN.
	    this.lexerActions = null;
	    this.modeToStartState = [];

	    return this;
	}

	// Compute the set of valid tokens that can occur starting in state {@code s}.
	//  If {@code ctx} is null, the set of tokens will not include what can follow
	//  the rule surrounding {@code s}. In other words, the set will be
	//  restricted to tokens reachable staying within {@code s}'s rule.
	ATN.prototype.nextTokensInContext = function (s, ctx) {
	    var anal = new LL1Analyzer(this);
	    return anal.LOOK(s, null, ctx);
	};

	// Compute the set of valid tokens that can occur starting in {@code s} and
	// staying in same rule. {@link Token//EPSILON} is in set if we reach end of
	// rule.
	ATN.prototype.nextTokensNoContext = function (s) {
	    if (s.nextTokenWithinRule !== null) {
	        return s.nextTokenWithinRule;
	    }
	    s.nextTokenWithinRule = this.nextTokensInContext(s, null);
	    s.nextTokenWithinRule.readOnly = true;
	    return s.nextTokenWithinRule;
	};

	ATN.prototype.nextTokens = function (s, ctx) {
	    if (ctx === undefined) {
	        return this.nextTokensNoContext(s);
	    } else {
	        return this.nextTokensInContext(s, ctx);
	    }
	};

	ATN.prototype.addState = function (state) {
	    if (state !== null) {
	        state.atn = this;
	        state.stateNumber = this.states.length;
	    }
	    this.states.push(state);
	};

	ATN.prototype.removeState = function (state) {
	    this.states[state.stateNumber] = null; // just free mem, don't shift states in list
	};

	ATN.prototype.defineDecisionState = function (s) {
	    this.decisionToState.push(s);
	    s.decision = this.decisionToState.length - 1;
	    return s.decision;
	};

	ATN.prototype.getDecisionState = function (decision) {
	    if (this.decisionToState.length === 0) {
	        return null;
	    } else {
	        return this.decisionToState[decision];
	    }
	};

	// Computes the set of input symbols which could follow ATN state number
	// {@code stateNumber} in the specified full {@code context}. This method
	// considers the complete parser context, but does not evaluate semantic
	// predicates (i.e. all predicates encountered during the calculation are
	// assumed true). If a path in the ATN exists from the starting state to the
	// {@link RuleStopState} of the outermost context without matching any
	// symbols, {@link Token//EOF} is added to the returned set.
	//
	// <p>If {@code context} is {@code null}, it is treated as
	// {@link ParserRuleContext//EMPTY}.</p>
	//
	// @param stateNumber the ATN state number
	// @param context the full parse context
	// @return The set of potentially valid input symbols which could follow the
	// specified state in the specified context.
	// @throws IllegalArgumentException if the ATN does not contain a state with
	// number {@code stateNumber}
	var Token = __webpack_require__(6).Token;

	ATN.prototype.getExpectedTokens = function (stateNumber, ctx) {
	    if (stateNumber < 0 || stateNumber >= this.states.length) {
	        throw "Invalid state number.";
	    }
	    var s = this.states[stateNumber];
	    var following = this.nextTokens(s);
	    if (!following.contains(Token.EPSILON)) {
	        return following;
	    }
	    var expected = new IntervalSet();
	    expected.addSet(following);
	    expected.removeOne(Token.EPSILON);
	    while (ctx !== null && ctx.invokingState >= 0 && following.contains(Token.EPSILON)) {
	        var invokingState = this.states[ctx.invokingState];
	        var rt = invokingState.transitions[0];
	        following = this.nextTokens(rt.followState);
	        expected.addSet(following);
	        expected.removeOne(Token.EPSILON);
	        ctx = ctx.parentCtx;
	    }
	    if (following.contains(Token.EPSILON)) {
	        expected.addOne(Token.EOF);
	    }
	    return expected;
	};

	ATN.INVALID_ALT_NUMBER = 0;

	exports.ATN = ATN;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	var Set = __webpack_require__(5).Set;
	var BitSet = __webpack_require__(5).BitSet;
	var Token = __webpack_require__(6).Token;
	var ATNConfig = __webpack_require__(7).ATNConfig;
	var Interval = __webpack_require__(10).Interval;
	var IntervalSet = __webpack_require__(10).IntervalSet;
	var RuleStopState = __webpack_require__(8).RuleStopState;
	var RuleTransition = __webpack_require__(11).RuleTransition;
	var NotSetTransition = __webpack_require__(11).NotSetTransition;
	var WildcardTransition = __webpack_require__(11).WildcardTransition;
	var AbstractPredicateTransition = __webpack_require__(11).AbstractPredicateTransition;

	var pc = __webpack_require__(12);
	var predictionContextFromRuleContext = pc.predictionContextFromRuleContext;
	var PredictionContext = pc.PredictionContext;
	var SingletonPredictionContext = pc.SingletonPredictionContext;

	function LL1Analyzer(atn) {
	    this.atn = atn;
	}

	//* Special value added to the lookahead sets to indicate that we hit
	//  a predicate during analysis if {@code seeThruPreds==false}.
	///
	LL1Analyzer.HIT_PRED = Token.INVALID_TYPE;

	//*
	// Calculates the SLL(1) expected lookahead set for each outgoing transition
	// of an {@link ATNState}. The returned array has one element for each
	// outgoing transition in {@code s}. If the closure from transition
	// <em>i</em> leads to a semantic predicate before matching a symbol, the
	// element at index <em>i</em> of the result will be {@code null}.
	//
	// @param s the ATN state
	// @return the expected symbols for each outgoing transition of {@code s}.
	///
	LL1Analyzer.prototype.getDecisionLookahead = function (s) {
	    if (s === null) {
	        return null;
	    }
	    var count = s.transitions.length;
	    var look = [];
	    for (var alt = 0; alt < count; alt++) {
	        look[alt] = new IntervalSet();
	        var lookBusy = new Set();
	        var seeThruPreds = false; // fail to get lookahead upon pred
	        this._LOOK(s.transition(alt).target, null, PredictionContext.EMPTY, look[alt], lookBusy, new BitSet(), seeThruPreds, false);
	        // Wipe out lookahead for this alternative if we found nothing
	        // or we had a predicate when we !seeThruPreds
	        if (look[alt].length === 0 || look[alt].contains(LL1Analyzer.HIT_PRED)) {
	            look[alt] = null;
	        }
	    }
	    return look;
	};

	//*
	// Compute set of tokens that can follow {@code s} in the ATN in the
	// specified {@code ctx}.
	//
	// <p>If {@code ctx} is {@code null} and the end of the rule containing
	// {@code s} is reached, {@link Token//EPSILON} is added to the result set.
	// If {@code ctx} is not {@code null} and the end of the outermost rule is
	// reached, {@link Token//EOF} is added to the result set.</p>
	//
	// @param s the ATN state
	// @param stopState the ATN state to stop at. This can be a
	// {@link BlockEndState} to detect epsilon paths through a closure.
	// @param ctx the complete parser context, or {@code null} if the context
	// should be ignored
	//
	// @return The set of tokens that can follow {@code s} in the ATN in the
	// specified {@code ctx}.
	///
	LL1Analyzer.prototype.LOOK = function (s, stopState, ctx) {
	    var r = new IntervalSet();
	    var seeThruPreds = true; // ignore preds; get all lookahead
	    ctx = ctx || null;
	    var lookContext = ctx !== null ? predictionContextFromRuleContext(s.atn, ctx) : null;
	    this._LOOK(s, stopState, lookContext, r, new Set(), new BitSet(), seeThruPreds, true);
	    return r;
	};

	//*
	// Compute set of tokens that can follow {@code s} in the ATN in the
	// specified {@code ctx}.
	//
	// <p>If {@code ctx} is {@code null} and {@code stopState} or the end of the
	// rule containing {@code s} is reached, {@link Token//EPSILON} is added to
	// the result set. If {@code ctx} is not {@code null} and {@code addEOF} is
	// {@code true} and {@code stopState} or the end of the outermost rule is
	// reached, {@link Token//EOF} is added to the result set.</p>
	//
	// @param s the ATN state.
	// @param stopState the ATN state to stop at. This can be a
	// {@link BlockEndState} to detect epsilon paths through a closure.
	// @param ctx The outer context, or {@code null} if the outer context should
	// not be used.
	// @param look The result lookahead set.
	// @param lookBusy A set used for preventing epsilon closures in the ATN
	// from causing a stack overflow. Outside code should pass
	// {@code new Set<ATNConfig>} for this argument.
	// @param calledRuleStack A set used for preventing left recursion in the
	// ATN from causing a stack overflow. Outside code should pass
	// {@code new BitSet()} for this argument.
	// @param seeThruPreds {@code true} to true semantic predicates as
	// implicitly {@code true} and "see through them", otherwise {@code false}
	// to treat semantic predicates as opaque and add {@link //HIT_PRED} to the
	// result if one is encountered.
	// @param addEOF Add {@link Token//EOF} to the result if the end of the
	// outermost context is reached. This parameter has no effect if {@code ctx}
	// is {@code null}.
	///
	LL1Analyzer.prototype._LOOK = function (s, stopState, ctx, look, lookBusy, calledRuleStack, seeThruPreds, addEOF) {
	    var c = new ATNConfig({ state: s, alt: 0, context: ctx }, null);
	    if (lookBusy.contains(c)) {
	        return;
	    }
	    lookBusy.add(c);
	    if (s === stopState) {
	        if (ctx === null) {
	            look.addOne(Token.EPSILON);
	            return;
	        } else if (ctx.isEmpty() && addEOF) {
	            look.addOne(Token.EOF);
	            return;
	        }
	    }
	    if (s instanceof RuleStopState) {
	        if (ctx === null) {
	            look.addOne(Token.EPSILON);
	            return;
	        } else if (ctx.isEmpty() && addEOF) {
	            look.addOne(Token.EOF);
	            return;
	        }
	        if (ctx !== PredictionContext.EMPTY) {
	            // run thru all possible stack tops in ctx
	            for (var i = 0; i < ctx.length; i++) {
	                var returnState = this.atn.states[ctx.getReturnState(i)];
	                var removed = calledRuleStack.contains(returnState.ruleIndex);
	                try {
	                    calledRuleStack.remove(returnState.ruleIndex);
	                    this._LOOK(returnState, stopState, ctx.getParent(i), look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
	                } finally {
	                    if (removed) {
	                        calledRuleStack.add(returnState.ruleIndex);
	                    }
	                }
	            }
	            return;
	        }
	    }
	    for (var j = 0; j < s.transitions.length; j++) {
	        var t = s.transitions[j];
	        if (t.constructor === RuleTransition) {
	            if (calledRuleStack.contains(t.target.ruleIndex)) {
	                continue;
	            }
	            var newContext = SingletonPredictionContext.create(ctx, t.followState.stateNumber);
	            try {
	                calledRuleStack.add(t.target.ruleIndex);
	                this._LOOK(t.target, stopState, newContext, look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
	            } finally {
	                calledRuleStack.remove(t.target.ruleIndex);
	            }
	        } else if (t instanceof AbstractPredicateTransition) {
	            if (seeThruPreds) {
	                this._LOOK(t.target, stopState, ctx, look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
	            } else {
	                look.addOne(LL1Analyzer.HIT_PRED);
	            }
	        } else if (t.isEpsilon) {
	            this._LOOK(t.target, stopState, ctx, look, lookBusy, calledRuleStack, seeThruPreds, addEOF);
	        } else if (t.constructor === WildcardTransition) {
	            look.addRange(Token.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType);
	        } else {
	            var set = t.label;
	            if (set !== null) {
	                if (t instanceof NotSetTransition) {
	                    set = set.complement(Token.MIN_USER_TOKEN_TYPE, this.atn.maxTokenType);
	                }
	                look.addSet(set);
	            }
	        }
	    }
	};

	exports.LL1Analyzer = LL1Analyzer;

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	function arrayToString(a) {
	    return "[" + a.join(", ") + "]";
	}

	String.prototype.seed = String.prototype.seed || Math.round(Math.random() * Math.pow(2, 32));

	String.prototype.hashCode = function () {
	    var remainder,
	        bytes,
	        h1,
	        h1b,
	        c1,
	        c1b,
	        c2,
	        c2b,
	        k1,
	        i,
	        key = this.toString();

	    remainder = key.length & 3; // key.length % 4
	    bytes = key.length - remainder;
	    h1 = String.prototype.seed;
	    c1 = 0xcc9e2d51;
	    c2 = 0x1b873593;
	    i = 0;

	    while (i < bytes) {
	        k1 = key.charCodeAt(i) & 0xff | (key.charCodeAt(++i) & 0xff) << 8 | (key.charCodeAt(++i) & 0xff) << 16 | (key.charCodeAt(++i) & 0xff) << 24;
	        ++i;

	        k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
	        k1 = k1 << 15 | k1 >>> 17;
	        k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;

	        h1 ^= k1;
	        h1 = h1 << 13 | h1 >>> 19;
	        h1b = (h1 & 0xffff) * 5 + (((h1 >>> 16) * 5 & 0xffff) << 16) & 0xffffffff;
	        h1 = (h1b & 0xffff) + 0x6b64 + (((h1b >>> 16) + 0xe654 & 0xffff) << 16);
	    }

	    k1 = 0;

	    switch (remainder) {
	        case 3:
	            k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
	        case 2:
	            k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
	        case 1:
	            k1 ^= key.charCodeAt(i) & 0xff;

	            k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
	            k1 = k1 << 15 | k1 >>> 17;
	            k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;
	            h1 ^= k1;
	    }

	    h1 ^= key.length;

	    h1 ^= h1 >>> 16;
	    h1 = (h1 & 0xffff) * 0x85ebca6b + (((h1 >>> 16) * 0x85ebca6b & 0xffff) << 16) & 0xffffffff;
	    h1 ^= h1 >>> 13;
	    h1 = (h1 & 0xffff) * 0xc2b2ae35 + (((h1 >>> 16) * 0xc2b2ae35 & 0xffff) << 16) & 0xffffffff;
	    h1 ^= h1 >>> 16;

	    return h1 >>> 0;
	};

	function standardEqualsFunction(a, b) {
	    return a.equals(b);
	}

	function standardHashCodeFunction(a) {
	    return a.hashCode();
	}

	function Set(hashFunction, equalsFunction) {
	    this.data = {};
	    this.hashFunction = hashFunction || standardHashCodeFunction;
	    this.equalsFunction = equalsFunction || standardEqualsFunction;
	    return this;
	}

	Object.defineProperty(Set.prototype, "length", {
	    get: function get() {
	        var l = 0;
	        for (var key in this.data) {
	            if (key.indexOf("hash_") === 0) {
	                l = l + this.data[key].length;
	            }
	        }
	        return l;
	    }
	});

	Set.prototype.add = function (value) {
	    var hash = this.hashFunction(value);
	    var key = "hash_" + hash;
	    if (key in this.data) {
	        var values = this.data[key];
	        for (var i = 0; i < values.length; i++) {
	            if (this.equalsFunction(value, values[i])) {
	                return values[i];
	            }
	        }
	        values.push(value);
	        return value;
	    } else {
	        this.data[key] = [value];
	        return value;
	    }
	};

	Set.prototype.contains = function (value) {
	    return this.get(value) != null;
	};

	Set.prototype.get = function (value) {
	    var hash = this.hashFunction(value);
	    var key = "hash_" + hash;
	    if (key in this.data) {
	        var values = this.data[key];
	        for (var i = 0; i < values.length; i++) {
	            if (this.equalsFunction(value, values[i])) {
	                return values[i];
	            }
	        }
	    }
	    return null;
	};

	Set.prototype.values = function () {
	    var l = [];
	    for (var key in this.data) {
	        if (key.indexOf("hash_") === 0) {
	            l = l.concat(this.data[key]);
	        }
	    }
	    return l;
	};

	Set.prototype.toString = function () {
	    return arrayToString(this.values());
	};

	function BitSet() {
	    this.data = [];
	    return this;
	}

	BitSet.prototype.add = function (value) {
	    this.data[value] = true;
	};

	BitSet.prototype.or = function (set) {
	    var bits = this;
	    Object.keys(set.data).map(function (alt) {
	        bits.add(alt);
	    });
	};

	BitSet.prototype.remove = function (value) {
	    delete this.data[value];
	};

	BitSet.prototype.contains = function (value) {
	    return this.data[value] === true;
	};

	BitSet.prototype.values = function () {
	    return Object.keys(this.data);
	};

	BitSet.prototype.minValue = function () {
	    return Math.min.apply(null, this.values());
	};

	BitSet.prototype.hashCode = function () {
	    var hash = new Hash();
	    hash.update(this.values());
	    return hash.finish();
	};

	BitSet.prototype.equals = function (other) {
	    if (!(other instanceof BitSet)) {
	        return false;
	    }
	    return this.hashCode() === other.hashCode();
	};

	Object.defineProperty(BitSet.prototype, "length", {
	    get: function get() {
	        return this.values().length;
	    }
	});

	BitSet.prototype.toString = function () {
	    return "{" + this.values().join(", ") + "}";
	};

	function Map(hashFunction, equalsFunction) {
	    this.data = {};
	    this.hashFunction = hashFunction || standardHashCodeFunction;
	    this.equalsFunction = equalsFunction || standardEqualsFunction;
	    return this;
	}

	Object.defineProperty(Map.prototype, "length", {
	    get: function get() {
	        var l = 0;
	        for (var hashKey in this.data) {
	            if (hashKey.indexOf("hash_") === 0) {
	                l = l + this.data[hashKey].length;
	            }
	        }
	        return l;
	    }
	});

	Map.prototype.put = function (key, value) {
	    var hashKey = "hash_" + this.hashFunction(key);
	    if (hashKey in this.data) {
	        var entries = this.data[hashKey];
	        for (var i = 0; i < entries.length; i++) {
	            var entry = entries[i];
	            if (this.equalsFunction(key, entry.key)) {
	                var oldValue = entry.value;
	                entry.value = value;
	                return oldValue;
	            }
	        }
	        entries.push({ key: key, value: value });
	        return value;
	    } else {
	        this.data[hashKey] = [{ key: key, value: value }];
	        return value;
	    }
	};

	Map.prototype.containsKey = function (key) {
	    var hashKey = "hash_" + this.hashFunction(key);
	    if (hashKey in this.data) {
	        var entries = this.data[hashKey];
	        for (var i = 0; i < entries.length; i++) {
	            var entry = entries[i];
	            if (this.equalsFunction(key, entry.key)) return true;
	        }
	    }
	    return false;
	};

	Map.prototype.get = function (key) {
	    var hashKey = "hash_" + this.hashFunction(key);
	    if (hashKey in this.data) {
	        var entries = this.data[hashKey];
	        for (var i = 0; i < entries.length; i++) {
	            var entry = entries[i];
	            if (this.equalsFunction(key, entry.key)) return entry.value;
	        }
	    }
	    return null;
	};

	Map.prototype.entries = function () {
	    var l = [];
	    for (var key in this.data) {
	        if (key.indexOf("hash_") === 0) {
	            l = l.concat(this.data[key]);
	        }
	    }
	    return l;
	};

	Map.prototype.getKeys = function () {
	    return this.entries().map(function (e) {
	        return e.key;
	    });
	};

	Map.prototype.getValues = function () {
	    return this.entries().map(function (e) {
	        return e.value;
	    });
	};

	Map.prototype.toString = function () {
	    var ss = this.entries().map(function (entry) {
	        return '{' + entry.key + ':' + entry.value + '}';
	    });
	    return '[' + ss.join(", ") + ']';
	};

	function AltDict() {
	    this.data = {};
	    return this;
	}

	AltDict.prototype.get = function (key) {
	    key = "k-" + key;
	    if (key in this.data) {
	        return this.data[key];
	    } else {
	        return null;
	    }
	};

	AltDict.prototype.put = function (key, value) {
	    key = "k-" + key;
	    this.data[key] = value;
	};

	AltDict.prototype.values = function () {
	    var data = this.data;
	    var keys = Object.keys(this.data);
	    return keys.map(function (key) {
	        return data[key];
	    });
	};

	function DoubleDict() {
	    return this;
	}

	function Hash() {
	    this.count = 0;
	    this.hash = 0;
	    return this;
	}

	Hash.prototype.update = function () {
	    for (var i = 0; i < arguments.length; i++) {
	        var value = arguments[i];
	        if (value == null) continue;
	        if (Array.isArray(value)) this.update.apply(value);else {
	            var k = 0;
	            switch (typeof value === "undefined" ? "undefined" : _typeof(value)) {
	                case 'undefined':
	                case 'function':
	                    continue;
	                case 'number':
	                case 'boolean':
	                    k = value;
	                    break;
	                case 'string':
	                    k = value.hashCode();
	                    break;
	                default:
	                    value.updateHashCode(this);
	                    continue;
	            }
	            k = k * 0xCC9E2D51;
	            k = k << 15 | k >>> 32 - 15;
	            k = k * 0x1B873593;
	            this.count = this.count + 1;
	            var hash = this.hash ^ k;
	            hash = hash << 13 | hash >>> 32 - 13;
	            hash = hash * 5 + 0xE6546B64;
	            this.hash = hash;
	        }
	    }
	};

	Hash.prototype.finish = function () {
	    var hash = this.hash ^ this.count * 4;
	    hash = hash ^ hash >>> 16;
	    hash = hash * 0x85EBCA6B;
	    hash = hash ^ hash >>> 13;
	    hash = hash * 0xC2B2AE35;
	    hash = hash ^ hash >>> 16;
	    return hash;
	};

	function hashStuff() {
	    var hash = new Hash();
	    hash.update.apply(arguments);
	    return hash.finish();
	}

	DoubleDict.prototype.get = function (a, b) {
	    var d = this[a] || null;
	    return d === null ? null : d[b] || null;
	};

	DoubleDict.prototype.set = function (a, b, o) {
	    var d = this[a] || null;
	    if (d === null) {
	        d = {};
	        this[a] = d;
	    }
	    d[b] = o;
	};

	function escapeWhitespace(s, escapeSpaces) {
	    s = s.replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
	    if (escapeSpaces) {
	        s = s.replace(/ /g, "\xB7");
	    }
	    return s;
	}

	function titleCase(str) {
	    return str.replace(/\w\S*/g, function (txt) {
	        return txt.charAt(0).toUpperCase() + txt.substr(1);
	    });
	};

	function equalArrays(a, b) {
	    if (!Array.isArray(a) || !Array.isArray(b)) return false;
	    if (a == b) return true;
	    if (a.length != b.length) return false;
	    for (var i = 0; i < a.length; i++) {
	        if (a[i] == b[i]) continue;
	        if (!a[i].equals(b[i])) return false;
	    }
	    return true;
	};

	exports.Hash = Hash;
	exports.Set = Set;
	exports.Map = Map;
	exports.BitSet = BitSet;
	exports.AltDict = AltDict;
	exports.DoubleDict = DoubleDict;
	exports.hashStuff = hashStuff;
	exports.escapeWhitespace = escapeWhitespace;
	exports.arrayToString = arrayToString;
	exports.titleCase = titleCase;
	exports.equalArrays = equalArrays;

/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	// A token has properties: text, type, line, character position in the line
	// (so we can ignore tabs), token channel, index, and source from which
	// we obtained this token.

	function Token() {
		this.source = null;
		this.type = null; // token type of the token
		this.channel = null; // The parser ignores everything not on DEFAULT_CHANNEL
		this.start = null; // optional; return -1 if not implemented.
		this.stop = null; // optional; return -1 if not implemented.
		this.tokenIndex = null; // from 0..n-1 of the token object in the input stream
		this.line = null; // line=1..n of the 1st character
		this.column = null; // beginning of the line at which it occurs, 0..n-1
		this._text = null; // text of the token.
		return this;
	}

	Token.INVALID_TYPE = 0;

	// During lookahead operations, this "token" signifies we hit rule end ATN state
	// and did not follow it despite needing to.
	Token.EPSILON = -2;

	Token.MIN_USER_TOKEN_TYPE = 1;

	Token.EOF = -1;

	// All tokens go to the parser (unless skip() is called in that rule)
	// on a particular "channel". The parser tunes to a particular channel
	// so that whitespace etc... can go to the parser on a "hidden" channel.

	Token.DEFAULT_CHANNEL = 0;

	// Anything on different channel than DEFAULT_CHANNEL is not parsed
	// by parser.

	Token.HIDDEN_CHANNEL = 1;

	// Explicitly set the text for this token. If {code text} is not
	// {@code null}, then {@link //getText} will return this value rather than
	// extracting the text from the input.
	//
	// @param text The explicit text of the token, or {@code null} if the text
	// should be obtained from the input along with the start and stop indexes
	// of the token.

	Object.defineProperty(Token.prototype, "text", {
		get: function get() {
			return this._text;
		},
		set: function set(text) {
			this._text = text;
		}
	});

	Token.prototype.getTokenSource = function () {
		return this.source[0];
	};

	Token.prototype.getInputStream = function () {
		return this.source[1];
	};

	function CommonToken(source, type, channel, start, stop) {
		Token.call(this);
		this.source = source !== undefined ? source : CommonToken.EMPTY_SOURCE;
		this.type = type !== undefined ? type : null;
		this.channel = channel !== undefined ? channel : Token.DEFAULT_CHANNEL;
		this.start = start !== undefined ? start : -1;
		this.stop = stop !== undefined ? stop : -1;
		this.tokenIndex = -1;
		if (this.source[0] !== null) {
			this.line = source[0].line;
			this.column = source[0].column;
		} else {
			this.column = -1;
		}
		return this;
	}

	CommonToken.prototype = Object.create(Token.prototype);
	CommonToken.prototype.constructor = CommonToken;

	// An empty {@link Pair} which is used as the default value of
	// {@link //source} for tokens that do not have a source.
	CommonToken.EMPTY_SOURCE = [null, null];

	// Constructs a new {@link CommonToken} as a copy of another {@link Token}.
	//
	// <p>
	// If {@code oldToken} is also a {@link CommonToken} instance, the newly
	// constructed token will share a reference to the {@link //text} field and
	// the {@link Pair} stored in {@link //source}. Otherwise, {@link //text} will
	// be assigned the result of calling {@link //getText}, and {@link //source}
	// will be constructed from the result of {@link Token//getTokenSource} and
	// {@link Token//getInputStream}.</p>
	//
	// @param oldToken The token to copy.
	//
	CommonToken.prototype.clone = function () {
		var t = new CommonToken(this.source, this.type, this.channel, this.start, this.stop);
		t.tokenIndex = this.tokenIndex;
		t.line = this.line;
		t.column = this.column;
		t.text = this.text;
		return t;
	};

	Object.defineProperty(CommonToken.prototype, "text", {
		get: function get() {
			if (this._text !== null) {
				return this._text;
			}
			var input = this.getInputStream();
			if (input === null) {
				return null;
			}
			var n = input.size;
			if (this.start < n && this.stop < n) {
				return input.getText(this.start, this.stop);
			} else {
				return "<EOF>";
			}
		},
		set: function set(text) {
			this._text = text;
		}
	});

	CommonToken.prototype.toString = function () {
		var txt = this.text;
		if (txt !== null) {
			txt = txt.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
		} else {
			txt = "<no text>";
		}
		return "[@" + this.tokenIndex + "," + this.start + ":" + this.stop + "='" + txt + "',<" + this.type + ">" + (this.channel > 0 ? ",channel=" + this.channel : "") + "," + this.line + ":" + this.column + "]";
	};

	exports.Token = Token;
	exports.CommonToken = CommonToken;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	// A tuple: (ATN state, predicted alt, syntactic, semantic context).
	//  The syntactic context is a graph-structured stack node whose
	//  path(s) to the root is the rule invocation(s)
	//  chain used to arrive at the state.  The semantic context is
	//  the tree of semantic predicates encountered before reaching
	//  an ATN state.
	///

	var DecisionState = __webpack_require__(8).DecisionState;
	var SemanticContext = __webpack_require__(9).SemanticContext;
	var Hash = __webpack_require__(5).Hash;

	function checkParams(params, isCfg) {
	    if (params === null) {
	        var result = { state: null, alt: null, context: null, semanticContext: null };
	        if (isCfg) {
	            result.reachesIntoOuterContext = 0;
	        }
	        return result;
	    } else {
	        var props = {};
	        props.state = params.state || null;
	        props.alt = params.alt === undefined ? null : params.alt;
	        props.context = params.context || null;
	        props.semanticContext = params.semanticContext || null;
	        if (isCfg) {
	            props.reachesIntoOuterContext = params.reachesIntoOuterContext || 0;
	            props.precedenceFilterSuppressed = params.precedenceFilterSuppressed || false;
	        }
	        return props;
	    }
	}

	function ATNConfig(params, config) {
	    this.checkContext(params, config);
	    params = checkParams(params);
	    config = checkParams(config, true);
	    // The ATN state associated with this configuration///
	    this.state = params.state !== null ? params.state : config.state;
	    // What alt (or lexer rule) is predicted by this configuration///
	    this.alt = params.alt !== null ? params.alt : config.alt;
	    // The stack of invoking states leading to the rule/states associated
	    //  with this config.  We track only those contexts pushed during
	    //  execution of the ATN simulator.
	    this.context = params.context !== null ? params.context : config.context;
	    this.semanticContext = params.semanticContext !== null ? params.semanticContext : config.semanticContext !== null ? config.semanticContext : SemanticContext.NONE;
	    // We cannot execute predicates dependent upon local context unless
	    // we know for sure we are in the correct context. Because there is
	    // no way to do this efficiently, we simply cannot evaluate
	    // dependent predicates unless we are in the rule that initially
	    // invokes the ATN simulator.
	    //
	    // closure() tracks the depth of how far we dip into the
	    // outer context: depth &gt; 0.  Note that it may not be totally
	    // accurate depth since I don't ever decrement. TODO: make it a boolean then
	    this.reachesIntoOuterContext = config.reachesIntoOuterContext;
	    this.precedenceFilterSuppressed = config.precedenceFilterSuppressed;
	    return this;
	}

	ATNConfig.prototype.checkContext = function (params, config) {
	    if ((params.context === null || params.context === undefined) && (config === null || config.context === null || config.context === undefined)) {
	        this.context = null;
	    }
	};

	ATNConfig.prototype.hashCode = function () {
	    var hash = new Hash();
	    this.updateHashCode(hash);
	    return hash.finish();
	};

	ATNConfig.prototype.updateHashCode = function (hash) {
	    hash.update(this.state.stateNumber, this.alt, this.context, this.semanticContext);
	};

	// An ATN configuration is equal to another if both have
	//  the same state, they predict the same alternative, and
	//  syntactic/semantic contexts are the same.

	ATNConfig.prototype.equals = function (other) {
	    if (this === other) {
	        return true;
	    } else if (!(other instanceof ATNConfig)) {
	        return false;
	    } else {
	        return this.state.stateNumber === other.state.stateNumber && this.alt === other.alt && (this.context === null ? other.context === null : this.context.equals(other.context)) && this.semanticContext.equals(other.semanticContext) && this.precedenceFilterSuppressed === other.precedenceFilterSuppressed;
	    }
	};

	ATNConfig.prototype.hashCodeForConfigSet = function () {
	    var hash = new Hash();
	    hash.update(this.state.stateNumber, this.alt, this.semanticContext);
	    return hash.finish();
	};

	ATNConfig.prototype.equalsForConfigSet = function (other) {
	    if (this === other) {
	        return true;
	    } else if (!(other instanceof ATNConfig)) {
	        return false;
	    } else {
	        return this.state.stateNumber === other.state.stateNumber && this.alt === other.alt && this.semanticContext.equals(other.semanticContext);
	    }
	};

	ATNConfig.prototype.toString = function () {
	    return "(" + this.state + "," + this.alt + (this.context !== null ? ",[" + this.context.toString() + "]" : "") + (this.semanticContext !== SemanticContext.NONE ? "," + this.semanticContext.toString() : "") + (this.reachesIntoOuterContext > 0 ? ",up=" + this.reachesIntoOuterContext : "") + ")";
	};

	function LexerATNConfig(params, config) {
	    ATNConfig.call(this, params, config);

	    // This is the backing field for {@link //getLexerActionExecutor}.
	    var lexerActionExecutor = params.lexerActionExecutor || null;
	    this.lexerActionExecutor = lexerActionExecutor || (config !== null ? config.lexerActionExecutor : null);
	    this.passedThroughNonGreedyDecision = config !== null ? this.checkNonGreedyDecision(config, this.state) : false;
	    return this;
	}

	LexerATNConfig.prototype = Object.create(ATNConfig.prototype);
	LexerATNConfig.prototype.constructor = LexerATNConfig;

	LexerATNConfig.prototype.updateHashCode = function (hash) {
	    hash.update(this.state.stateNumber, this.alt, this.context, this.semanticContext, this.passedThroughNonGreedyDecision, this.lexerActionExecutor);
	};

	LexerATNConfig.prototype.equals = function (other) {
	    return this === other || other instanceof LexerATNConfig && this.passedThroughNonGreedyDecision == other.passedThroughNonGreedyDecision && (this.lexerActionExecutor ? this.lexerActionExecutor.equals(other.lexerActionExecutor) : !other.lexerActionExecutor) && ATNConfig.prototype.equals.call(this, other);
	};

	LexerATNConfig.prototype.hashCodeForConfigSet = LexerATNConfig.prototype.hashCode;

	LexerATNConfig.prototype.equalsForConfigSet = LexerATNConfig.prototype.equals;

	LexerATNConfig.prototype.checkNonGreedyDecision = function (source, target) {
	    return source.passedThroughNonGreedyDecision || target instanceof DecisionState && target.nonGreedy;
	};

	exports.ATNConfig = ATNConfig;
	exports.LexerATNConfig = LexerATNConfig;

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	// The following images show the relation of states and
	// {@link ATNState//transitions} for various grammar constructs.
	//
	// <ul>
	//
	// <li>Solid edges marked with an &//0949; indicate a required
	// {@link EpsilonTransition}.</li>
	//
	// <li>Dashed edges indicate locations where any transition derived from
	// {@link Transition} might appear.</li>
	//
	// <li>Dashed nodes are place holders for either a sequence of linked
	// {@link BasicState} states or the inclusion of a block representing a nested
	// construct in one of the forms below.</li>
	//
	// <li>Nodes showing multiple outgoing alternatives with a {@code ...} support
	// any number of alternatives (one or more). Nodes without the {@code ...} only
	// support the exact number of alternatives shown in the diagram.</li>
	//
	// </ul>
	//
	// <h2>Basic Blocks</h2>
	//
	// <h3>Rule</h3>
	//
	// <embed src="images/Rule.svg" type="image/svg+xml"/>
	//
	// <h3>Block of 1 or more alternatives</h3>
	//
	// <embed src="images/Block.svg" type="image/svg+xml"/>
	//
	// <h2>Greedy Loops</h2>
	//
	// <h3>Greedy Closure: {@code (...)*}</h3>
	//
	// <embed src="images/ClosureGreedy.svg" type="image/svg+xml"/>
	//
	// <h3>Greedy Positive Closure: {@code (...)+}</h3>
	//
	// <embed src="images/PositiveClosureGreedy.svg" type="image/svg+xml"/>
	//
	// <h3>Greedy Optional: {@code (...)?}</h3>
	//
	// <embed src="images/OptionalGreedy.svg" type="image/svg+xml"/>
	//
	// <h2>Non-Greedy Loops</h2>
	//
	// <h3>Non-Greedy Closure: {@code (...)*?}</h3>
	//
	// <embed src="images/ClosureNonGreedy.svg" type="image/svg+xml"/>
	//
	// <h3>Non-Greedy Positive Closure: {@code (...)+?}</h3>
	//
	// <embed src="images/PositiveClosureNonGreedy.svg" type="image/svg+xml"/>
	//
	// <h3>Non-Greedy Optional: {@code (...)??}</h3>
	//
	// <embed src="images/OptionalNonGreedy.svg" type="image/svg+xml"/>
	//

	var INITIAL_NUM_TRANSITIONS = 4;

	function ATNState() {
	  // Which ATN are we in?
	  this.atn = null;
	  this.stateNumber = ATNState.INVALID_STATE_NUMBER;
	  this.stateType = null;
	  this.ruleIndex = 0; // at runtime, we don't have Rule objects
	  this.epsilonOnlyTransitions = false;
	  // Track the transitions emanating from this ATN state.
	  this.transitions = [];
	  // Used to cache lookahead during parsing, not used during construction
	  this.nextTokenWithinRule = null;
	  return this;
	}

	// constants for serialization
	ATNState.INVALID_TYPE = 0;
	ATNState.BASIC = 1;
	ATNState.RULE_START = 2;
	ATNState.BLOCK_START = 3;
	ATNState.PLUS_BLOCK_START = 4;
	ATNState.STAR_BLOCK_START = 5;
	ATNState.TOKEN_START = 6;
	ATNState.RULE_STOP = 7;
	ATNState.BLOCK_END = 8;
	ATNState.STAR_LOOP_BACK = 9;
	ATNState.STAR_LOOP_ENTRY = 10;
	ATNState.PLUS_LOOP_BACK = 11;
	ATNState.LOOP_END = 12;

	ATNState.serializationNames = ["INVALID", "BASIC", "RULE_START", "BLOCK_START", "PLUS_BLOCK_START", "STAR_BLOCK_START", "TOKEN_START", "RULE_STOP", "BLOCK_END", "STAR_LOOP_BACK", "STAR_LOOP_ENTRY", "PLUS_LOOP_BACK", "LOOP_END"];

	ATNState.INVALID_STATE_NUMBER = -1;

	ATNState.prototype.toString = function () {
	  return this.stateNumber;
	};

	ATNState.prototype.equals = function (other) {
	  if (other instanceof ATNState) {
	    return this.stateNumber === other.stateNumber;
	  } else {
	    return false;
	  }
	};

	ATNState.prototype.isNonGreedyExitState = function () {
	  return false;
	};

	ATNState.prototype.addTransition = function (trans, index) {
	  if (index === undefined) {
	    index = -1;
	  }
	  if (this.transitions.length === 0) {
	    this.epsilonOnlyTransitions = trans.isEpsilon;
	  } else if (this.epsilonOnlyTransitions !== trans.isEpsilon) {
	    this.epsilonOnlyTransitions = false;
	  }
	  if (index === -1) {
	    this.transitions.push(trans);
	  } else {
	    this.transitions.splice(index, 1, trans);
	  }
	};

	function BasicState() {
	  ATNState.call(this);
	  this.stateType = ATNState.BASIC;
	  return this;
	}

	BasicState.prototype = Object.create(ATNState.prototype);
	BasicState.prototype.constructor = BasicState;

	function DecisionState() {
	  ATNState.call(this);
	  this.decision = -1;
	  this.nonGreedy = false;
	  return this;
	}

	DecisionState.prototype = Object.create(ATNState.prototype);
	DecisionState.prototype.constructor = DecisionState;

	//  The start of a regular {@code (...)} block.
	function BlockStartState() {
	  DecisionState.call(this);
	  this.endState = null;
	  return this;
	}

	BlockStartState.prototype = Object.create(DecisionState.prototype);
	BlockStartState.prototype.constructor = BlockStartState;

	function BasicBlockStartState() {
	  BlockStartState.call(this);
	  this.stateType = ATNState.BLOCK_START;
	  return this;
	}

	BasicBlockStartState.prototype = Object.create(BlockStartState.prototype);
	BasicBlockStartState.prototype.constructor = BasicBlockStartState;

	// Terminal node of a simple {@code (a|b|c)} block.
	function BlockEndState() {
	  ATNState.call(this);
	  this.stateType = ATNState.BLOCK_END;
	  this.startState = null;
	  return this;
	}

	BlockEndState.prototype = Object.create(ATNState.prototype);
	BlockEndState.prototype.constructor = BlockEndState;

	// The last node in the ATN for a rule, unless that rule is the start symbol.
	//  In that case, there is one transition to EOF. Later, we might encode
	//  references to all calls to this rule to compute FOLLOW sets for
	//  error handling.
	//
	function RuleStopState() {
	  ATNState.call(this);
	  this.stateType = ATNState.RULE_STOP;
	  return this;
	}

	RuleStopState.prototype = Object.create(ATNState.prototype);
	RuleStopState.prototype.constructor = RuleStopState;

	function RuleStartState() {
	  ATNState.call(this);
	  this.stateType = ATNState.RULE_START;
	  this.stopState = null;
	  this.isPrecedenceRule = false;
	  return this;
	}

	RuleStartState.prototype = Object.create(ATNState.prototype);
	RuleStartState.prototype.constructor = RuleStartState;

	// Decision state for {@code A+} and {@code (A|B)+}.  It has two transitions:
	//  one to the loop back to start of the block and one to exit.
	//
	function PlusLoopbackState() {
	  DecisionState.call(this);
	  this.stateType = ATNState.PLUS_LOOP_BACK;
	  return this;
	}

	PlusLoopbackState.prototype = Object.create(DecisionState.prototype);
	PlusLoopbackState.prototype.constructor = PlusLoopbackState;

	// Start of {@code (A|B|...)+} loop. Technically a decision state, but
	//  we don't use for code generation; somebody might need it, so I'm defining
	//  it for completeness. In reality, the {@link PlusLoopbackState} node is the
	//  real decision-making note for {@code A+}.
	//
	function PlusBlockStartState() {
	  BlockStartState.call(this);
	  this.stateType = ATNState.PLUS_BLOCK_START;
	  this.loopBackState = null;
	  return this;
	}

	PlusBlockStartState.prototype = Object.create(BlockStartState.prototype);
	PlusBlockStartState.prototype.constructor = PlusBlockStartState;

	// The block that begins a closure loop.
	function StarBlockStartState() {
	  BlockStartState.call(this);
	  this.stateType = ATNState.STAR_BLOCK_START;
	  return this;
	}

	StarBlockStartState.prototype = Object.create(BlockStartState.prototype);
	StarBlockStartState.prototype.constructor = StarBlockStartState;

	function StarLoopbackState() {
	  ATNState.call(this);
	  this.stateType = ATNState.STAR_LOOP_BACK;
	  return this;
	}

	StarLoopbackState.prototype = Object.create(ATNState.prototype);
	StarLoopbackState.prototype.constructor = StarLoopbackState;

	function StarLoopEntryState() {
	  DecisionState.call(this);
	  this.stateType = ATNState.STAR_LOOP_ENTRY;
	  this.loopBackState = null;
	  // Indicates whether this state can benefit from a precedence DFA during SLL decision making.
	  this.isPrecedenceDecision = null;
	  return this;
	}

	StarLoopEntryState.prototype = Object.create(DecisionState.prototype);
	StarLoopEntryState.prototype.constructor = StarLoopEntryState;

	// Mark the end of a * or + loop.
	function LoopEndState() {
	  ATNState.call(this);
	  this.stateType = ATNState.LOOP_END;
	  this.loopBackState = null;
	  return this;
	}

	LoopEndState.prototype = Object.create(ATNState.prototype);
	LoopEndState.prototype.constructor = LoopEndState;

	// The Tokens rule start state linking to each lexer rule start state */
	function TokensStartState() {
	  DecisionState.call(this);
	  this.stateType = ATNState.TOKEN_START;
	  return this;
	}

	TokensStartState.prototype = Object.create(DecisionState.prototype);
	TokensStartState.prototype.constructor = TokensStartState;

	exports.ATNState = ATNState;
	exports.BasicState = BasicState;
	exports.DecisionState = DecisionState;
	exports.BlockStartState = BlockStartState;
	exports.BlockEndState = BlockEndState;
	exports.LoopEndState = LoopEndState;
	exports.RuleStartState = RuleStartState;
	exports.RuleStopState = RuleStopState;
	exports.TokensStartState = TokensStartState;
	exports.PlusLoopbackState = PlusLoopbackState;
	exports.StarLoopbackState = StarLoopbackState;
	exports.StarLoopEntryState = StarLoopEntryState;
	exports.PlusBlockStartState = PlusBlockStartState;
	exports.StarBlockStartState = StarBlockStartState;
	exports.BasicBlockStartState = BasicBlockStartState;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	// A tree structure used to record the semantic context in which
	//  an ATN configuration is valid.  It's either a single predicate,
	//  a conjunction {@code p1&&p2}, or a sum of products {@code p1||p2}.
	//
	//  <p>I have scoped the {@link AND}, {@link OR}, and {@link Predicate} subclasses of
	//  {@link SemanticContext} within the scope of this outer class.</p>
	//

	var Set = __webpack_require__(5).Set;
	var Hash = __webpack_require__(5).Hash;

	function SemanticContext() {
		return this;
	}

	SemanticContext.prototype.hashCode = function () {
		var hash = new Hash();
		this.updateHashCode(hash);
		return hash.finish();
	};

	// For context independent predicates, we evaluate them without a local
	// context (i.e., null context). That way, we can evaluate them without
	// having to create proper rule-specific context during prediction (as
	// opposed to the parser, which creates them naturally). In a practical
	// sense, this avoids a cast exception from RuleContext to myruleContext.
	//
	// <p>For context dependent predicates, we must pass in a local context so that
	// references such as $arg evaluate properly as _localctx.arg. We only
	// capture context dependent predicates in the context in which we begin
	// prediction, so we passed in the outer context here in case of context
	// dependent predicate evaluation.</p>
	//
	SemanticContext.prototype.evaluate = function (parser, outerContext) {};

	//
	// Evaluate the precedence predicates for the context and reduce the result.
	//
	// @param parser The parser instance.
	// @param outerContext The current parser context object.
	// @return The simplified semantic context after precedence predicates are
	// evaluated, which will be one of the following values.
	// <ul>
	// <li>{@link //NONE}: if the predicate simplifies to {@code true} after
	// precedence predicates are evaluated.</li>
	// <li>{@code null}: if the predicate simplifies to {@code false} after
	// precedence predicates are evaluated.</li>
	// <li>{@code this}: if the semantic context is not changed as a result of
	// precedence predicate evaluation.</li>
	// <li>A non-{@code null} {@link SemanticContext}: the new simplified
	// semantic context after precedence predicates are evaluated.</li>
	// </ul>
	//
	SemanticContext.prototype.evalPrecedence = function (parser, outerContext) {
		return this;
	};

	SemanticContext.andContext = function (a, b) {
		if (a === null || a === SemanticContext.NONE) {
			return b;
		}
		if (b === null || b === SemanticContext.NONE) {
			return a;
		}
		var result = new AND(a, b);
		if (result.opnds.length === 1) {
			return result.opnds[0];
		} else {
			return result;
		}
	};

	SemanticContext.orContext = function (a, b) {
		if (a === null) {
			return b;
		}
		if (b === null) {
			return a;
		}
		if (a === SemanticContext.NONE || b === SemanticContext.NONE) {
			return SemanticContext.NONE;
		}
		var result = new OR(a, b);
		if (result.opnds.length === 1) {
			return result.opnds[0];
		} else {
			return result;
		}
	};

	function Predicate(ruleIndex, predIndex, isCtxDependent) {
		SemanticContext.call(this);
		this.ruleIndex = ruleIndex === undefined ? -1 : ruleIndex;
		this.predIndex = predIndex === undefined ? -1 : predIndex;
		this.isCtxDependent = isCtxDependent === undefined ? false : isCtxDependent; // e.g., $i ref in pred
		return this;
	}

	Predicate.prototype = Object.create(SemanticContext.prototype);
	Predicate.prototype.constructor = Predicate;

	//The default {@link SemanticContext}, which is semantically equivalent to
	//a predicate of the form {@code {true}?}.
	//
	SemanticContext.NONE = new Predicate();

	Predicate.prototype.evaluate = function (parser, outerContext) {
		var localctx = this.isCtxDependent ? outerContext : null;
		return parser.sempred(localctx, this.ruleIndex, this.predIndex);
	};

	Predicate.prototype.updateHashCode = function (hash) {
		hash.update(this.ruleIndex, this.predIndex, this.isCtxDependent);
	};

	Predicate.prototype.equals = function (other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof Predicate)) {
			return false;
		} else {
			return this.ruleIndex === other.ruleIndex && this.predIndex === other.predIndex && this.isCtxDependent === other.isCtxDependent;
		}
	};

	Predicate.prototype.toString = function () {
		return "{" + this.ruleIndex + ":" + this.predIndex + "}?";
	};

	function PrecedencePredicate(precedence) {
		SemanticContext.call(this);
		this.precedence = precedence === undefined ? 0 : precedence;
	}

	PrecedencePredicate.prototype = Object.create(SemanticContext.prototype);
	PrecedencePredicate.prototype.constructor = PrecedencePredicate;

	PrecedencePredicate.prototype.evaluate = function (parser, outerContext) {
		return parser.precpred(outerContext, this.precedence);
	};

	PrecedencePredicate.prototype.evalPrecedence = function (parser, outerContext) {
		if (parser.precpred(outerContext, this.precedence)) {
			return SemanticContext.NONE;
		} else {
			return null;
		}
	};

	PrecedencePredicate.prototype.compareTo = function (other) {
		return this.precedence - other.precedence;
	};

	PrecedencePredicate.prototype.updateHashCode = function (hash) {
		hash.update(31);
	};

	PrecedencePredicate.prototype.equals = function (other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof PrecedencePredicate)) {
			return false;
		} else {
			return this.precedence === other.precedence;
		}
	};

	PrecedencePredicate.prototype.toString = function () {
		return "{" + this.precedence + ">=prec}?";
	};

	PrecedencePredicate.filterPrecedencePredicates = function (set) {
		var result = [];
		set.values().map(function (context) {
			if (context instanceof PrecedencePredicate) {
				result.push(context);
			}
		});
		return result;
	};

	// A semantic context which is true whenever none of the contained contexts
	// is false.
	//
	function AND(a, b) {
		SemanticContext.call(this);
		var operands = new Set();
		if (a instanceof AND) {
			a.opnds.map(function (o) {
				operands.add(o);
			});
		} else {
			operands.add(a);
		}
		if (b instanceof AND) {
			b.opnds.map(function (o) {
				operands.add(o);
			});
		} else {
			operands.add(b);
		}
		var precedencePredicates = PrecedencePredicate.filterPrecedencePredicates(operands);
		if (precedencePredicates.length > 0) {
			// interested in the transition with the lowest precedence
			var reduced = null;
			precedencePredicates.map(function (p) {
				if (reduced === null || p.precedence < reduced.precedence) {
					reduced = p;
				}
			});
			operands.add(reduced);
		}
		this.opnds = operands.values();
		return this;
	}

	AND.prototype = Object.create(SemanticContext.prototype);
	AND.prototype.constructor = AND;

	AND.prototype.equals = function (other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof AND)) {
			return false;
		} else {
			return this.opnds === other.opnds;
		}
	};

	AND.prototype.updateHashCode = function (hash) {
		hash.update(this.opnds, "AND");
	};
	//
	// {@inheritDoc}
	//
	// <p>
	// The evaluation of predicates by this context is short-circuiting, but
	// unordered.</p>
	//
	AND.prototype.evaluate = function (parser, outerContext) {
		for (var i = 0; i < this.opnds.length; i++) {
			if (!this.opnds[i].evaluate(parser, outerContext)) {
				return false;
			}
		}
		return true;
	};

	AND.prototype.evalPrecedence = function (parser, outerContext) {
		var differs = false;
		var operands = [];
		for (var i = 0; i < this.opnds.length; i++) {
			var context = this.opnds[i];
			var evaluated = context.evalPrecedence(parser, outerContext);
			differs |= evaluated !== context;
			if (evaluated === null) {
				// The AND context is false if any element is false
				return null;
			} else if (evaluated !== SemanticContext.NONE) {
				// Reduce the result by skipping true elements
				operands.push(evaluated);
			}
		}
		if (!differs) {
			return this;
		}
		if (operands.length === 0) {
			// all elements were true, so the AND context is true
			return SemanticContext.NONE;
		}
		var result = null;
		operands.map(function (o) {
			result = result === null ? o : SemanticContext.andContext(result, o);
		});
		return result;
	};

	AND.prototype.toString = function () {
		var s = "";
		this.opnds.map(function (o) {
			s += "&& " + o.toString();
		});
		return s.length > 3 ? s.slice(3) : s;
	};

	//
	// A semantic context which is true whenever at least one of the contained
	// contexts is true.
	//
	function OR(a, b) {
		SemanticContext.call(this);
		var operands = new Set();
		if (a instanceof OR) {
			a.opnds.map(function (o) {
				operands.add(o);
			});
		} else {
			operands.add(a);
		}
		if (b instanceof OR) {
			b.opnds.map(function (o) {
				operands.add(o);
			});
		} else {
			operands.add(b);
		}

		var precedencePredicates = PrecedencePredicate.filterPrecedencePredicates(operands);
		if (precedencePredicates.length > 0) {
			// interested in the transition with the highest precedence
			var s = precedencePredicates.sort(function (a, b) {
				return a.compareTo(b);
			});
			var reduced = s[s.length - 1];
			operands.add(reduced);
		}
		this.opnds = operands.values();
		return this;
	}

	OR.prototype = Object.create(SemanticContext.prototype);
	OR.prototype.constructor = OR;

	OR.prototype.constructor = function (other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof OR)) {
			return false;
		} else {
			return this.opnds === other.opnds;
		}
	};

	OR.prototype.updateHashCode = function (hash) {
		hash.update(this.opnds, "OR");
	};

	// <p>
	// The evaluation of predicates by this context is short-circuiting, but
	// unordered.</p>
	//
	OR.prototype.evaluate = function (parser, outerContext) {
		for (var i = 0; i < this.opnds.length; i++) {
			if (this.opnds[i].evaluate(parser, outerContext)) {
				return true;
			}
		}
		return false;
	};

	OR.prototype.evalPrecedence = function (parser, outerContext) {
		var differs = false;
		var operands = [];
		for (var i = 0; i < this.opnds.length; i++) {
			var context = this.opnds[i];
			var evaluated = context.evalPrecedence(parser, outerContext);
			differs |= evaluated !== context;
			if (evaluated === SemanticContext.NONE) {
				// The OR context is true if any element is true
				return SemanticContext.NONE;
			} else if (evaluated !== null) {
				// Reduce the result by skipping false elements
				operands.push(evaluated);
			}
		}
		if (!differs) {
			return this;
		}
		if (operands.length === 0) {
			// all elements were false, so the OR context is false
			return null;
		}
		var result = null;
		operands.map(function (o) {
			return result === null ? o : SemanticContext.orContext(result, o);
		});
		return result;
	};

	OR.prototype.toString = function () {
		var s = "";
		this.opnds.map(function (o) {
			s += "|| " + o.toString();
		});
		return s.length > 3 ? s.slice(3) : s;
	};

	exports.SemanticContext = SemanticContext;
	exports.PrecedencePredicate = PrecedencePredicate;
	exports.Predicate = Predicate;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	/*jslint smarttabs:true */

	var Token = __webpack_require__(6).Token;

	/* stop is not included! */
	function Interval(start, stop) {
		this.start = start;
		this.stop = stop;
		return this;
	}

	Interval.prototype.contains = function (item) {
		return item >= this.start && item < this.stop;
	};

	Interval.prototype.toString = function () {
		if (this.start === this.stop - 1) {
			return this.start.toString();
		} else {
			return this.start.toString() + ".." + (this.stop - 1).toString();
		}
	};

	Object.defineProperty(Interval.prototype, "length", {
		get: function get() {
			return this.stop - this.start;
		}
	});

	function IntervalSet() {
		this.intervals = null;
		this.readOnly = false;
	}

	IntervalSet.prototype.first = function (v) {
		if (this.intervals === null || this.intervals.length === 0) {
			return Token.INVALID_TYPE;
		} else {
			return this.intervals[0].start;
		}
	};

	IntervalSet.prototype.addOne = function (v) {
		this.addInterval(new Interval(v, v + 1));
	};

	IntervalSet.prototype.addRange = function (l, h) {
		this.addInterval(new Interval(l, h + 1));
	};

	IntervalSet.prototype.addInterval = function (v) {
		if (this.intervals === null) {
			this.intervals = [];
			this.intervals.push(v);
		} else {
			// find insert pos
			for (var k = 0; k < this.intervals.length; k++) {
				var i = this.intervals[k];
				// distinct range -> insert
				if (v.stop < i.start) {
					this.intervals.splice(k, 0, v);
					return;
				}
				// contiguous range -> adjust
				else if (v.stop === i.start) {
						this.intervals[k].start = v.start;
						return;
					}
					// overlapping range -> adjust and reduce
					else if (v.start <= i.stop) {
							this.intervals[k] = new Interval(Math.min(i.start, v.start), Math.max(i.stop, v.stop));
							this.reduce(k);
							return;
						}
			}
			// greater than any existing
			this.intervals.push(v);
		}
	};

	IntervalSet.prototype.addSet = function (other) {
		if (other.intervals !== null) {
			for (var k = 0; k < other.intervals.length; k++) {
				var i = other.intervals[k];
				this.addInterval(new Interval(i.start, i.stop));
			}
		}
		return this;
	};

	IntervalSet.prototype.reduce = function (k) {
		// only need to reduce if k is not the last
		if (k < this.intervalslength - 1) {
			var l = this.intervals[k];
			var r = this.intervals[k + 1];
			// if r contained in l
			if (l.stop >= r.stop) {
				this.intervals.pop(k + 1);
				this.reduce(k);
			} else if (l.stop >= r.start) {
				this.intervals[k] = new Interval(l.start, r.stop);
				this.intervals.pop(k + 1);
			}
		}
	};

	IntervalSet.prototype.complement = function (start, stop) {
		var result = new IntervalSet();
		result.addInterval(new Interval(start, stop + 1));
		for (var i = 0; i < this.intervals.length; i++) {
			result.removeRange(this.intervals[i]);
		}
		return result;
	};

	IntervalSet.prototype.contains = function (item) {
		if (this.intervals === null) {
			return false;
		} else {
			for (var k = 0; k < this.intervals.length; k++) {
				if (this.intervals[k].contains(item)) {
					return true;
				}
			}
			return false;
		}
	};

	Object.defineProperty(IntervalSet.prototype, "length", {
		get: function get() {
			var len = 0;
			this.intervals.map(function (i) {
				len += i.length;
			});
			return len;
		}
	});

	IntervalSet.prototype.removeRange = function (v) {
		if (v.start === v.stop - 1) {
			this.removeOne(v.start);
		} else if (this.intervals !== null) {
			var k = 0;
			for (var n = 0; n < this.intervals.length; n++) {
				var i = this.intervals[k];
				// intervals are ordered
				if (v.stop <= i.start) {
					return;
				}
				// check for including range, split it
				else if (v.start > i.start && v.stop < i.stop) {
						this.intervals[k] = new Interval(i.start, v.start);
						var x = new Interval(v.stop, i.stop);
						this.intervals.splice(k, 0, x);
						return;
					}
					// check for included range, remove it
					else if (v.start <= i.start && v.stop >= i.stop) {
							this.intervals.splice(k, 1);
							k = k - 1; // need another pass
						}
						// check for lower boundary
						else if (v.start < i.stop) {
								this.intervals[k] = new Interval(i.start, v.start);
							}
							// check for upper boundary
							else if (v.stop < i.stop) {
									this.intervals[k] = new Interval(v.stop, i.stop);
								}
				k += 1;
			}
		}
	};

	IntervalSet.prototype.removeOne = function (v) {
		if (this.intervals !== null) {
			for (var k = 0; k < this.intervals.length; k++) {
				var i = this.intervals[k];
				// intervals is ordered
				if (v < i.start) {
					return;
				}
				// check for single value range
				else if (v === i.start && v === i.stop - 1) {
						this.intervals.splice(k, 1);
						return;
					}
					// check for lower boundary
					else if (v === i.start) {
							this.intervals[k] = new Interval(i.start + 1, i.stop);
							return;
						}
						// check for upper boundary
						else if (v === i.stop - 1) {
								this.intervals[k] = new Interval(i.start, i.stop - 1);
								return;
							}
							// split existing range
							else if (v < i.stop - 1) {
									var x = new Interval(i.start, v);
									i.start = v + 1;
									this.intervals.splice(k, 0, x);
									return;
								}
			}
		}
	};

	IntervalSet.prototype.toString = function (literalNames, symbolicNames, elemsAreChar) {
		literalNames = literalNames || null;
		symbolicNames = symbolicNames || null;
		elemsAreChar = elemsAreChar || false;
		if (this.intervals === null) {
			return "{}";
		} else if (literalNames !== null || symbolicNames !== null) {
			return this.toTokenString(literalNames, symbolicNames);
		} else if (elemsAreChar) {
			return this.toCharString();
		} else {
			return this.toIndexString();
		}
	};

	IntervalSet.prototype.toCharString = function () {
		var names = [];
		for (var i = 0; i < this.intervals.length; i++) {
			var v = this.intervals[i];
			if (v.stop === v.start + 1) {
				if (v.start === Token.EOF) {
					names.push("<EOF>");
				} else {
					names.push("'" + String.fromCharCode(v.start) + "'");
				}
			} else {
				names.push("'" + String.fromCharCode(v.start) + "'..'" + String.fromCharCode(v.stop - 1) + "'");
			}
		}
		if (names.length > 1) {
			return "{" + names.join(", ") + "}";
		} else {
			return names[0];
		}
	};

	IntervalSet.prototype.toIndexString = function () {
		var names = [];
		for (var i = 0; i < this.intervals.length; i++) {
			var v = this.intervals[i];
			if (v.stop === v.start + 1) {
				if (v.start === Token.EOF) {
					names.push("<EOF>");
				} else {
					names.push(v.start.toString());
				}
			} else {
				names.push(v.start.toString() + ".." + (v.stop - 1).toString());
			}
		}
		if (names.length > 1) {
			return "{" + names.join(", ") + "}";
		} else {
			return names[0];
		}
	};

	IntervalSet.prototype.toTokenString = function (literalNames, symbolicNames) {
		var names = [];
		for (var i = 0; i < this.intervals.length; i++) {
			var v = this.intervals[i];
			for (var j = v.start; j < v.stop; j++) {
				names.push(this.elementName(literalNames, symbolicNames, j));
			}
		}
		if (names.length > 1) {
			return "{" + names.join(", ") + "}";
		} else {
			return names[0];
		}
	};

	IntervalSet.prototype.elementName = function (literalNames, symbolicNames, a) {
		if (a === Token.EOF) {
			return "<EOF>";
		} else if (a === Token.EPSILON) {
			return "<EPSILON>";
		} else {
			return literalNames[a] || symbolicNames[a];
		}
	};

	exports.Interval = Interval;
	exports.IntervalSet = IntervalSet;

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	//  An ATN transition between any two ATN states.  Subclasses define
	//  atom, set, epsilon, action, predicate, rule transitions.
	//
	//  <p>This is a one way link.  It emanates from a state (usually via a list of
	//  transitions) and has a target state.</p>
	//
	//  <p>Since we never have to change the ATN transitions once we construct it,
	//  we can fix these transitions as specific classes. The DFA transitions
	//  on the other hand need to update the labels as it adds transitions to
	//  the states. We'll use the term Edge for the DFA to distinguish them from
	//  ATN transitions.</p>

	var Token = __webpack_require__(6).Token;
	var Interval = __webpack_require__(10).Interval;
	var IntervalSet = __webpack_require__(10).IntervalSet;
	var Predicate = __webpack_require__(9).Predicate;
	var PrecedencePredicate = __webpack_require__(9).PrecedencePredicate;

	function Transition(target) {
	  // The target of this transition.
	  if (target === undefined || target === null) {
	    throw "target cannot be null.";
	  }
	  this.target = target;
	  // Are we epsilon, action, sempred?
	  this.isEpsilon = false;
	  this.label = null;
	  return this;
	}
	// constants for serialization
	Transition.EPSILON = 1;
	Transition.RANGE = 2;
	Transition.RULE = 3;
	Transition.PREDICATE = 4; // e.g., {isType(input.LT(1))}?
	Transition.ATOM = 5;
	Transition.ACTION = 6;
	Transition.SET = 7; // ~(A|B) or ~atom, wildcard, which convert to next 2
	Transition.NOT_SET = 8;
	Transition.WILDCARD = 9;
	Transition.PRECEDENCE = 10;

	Transition.serializationNames = ["INVALID", "EPSILON", "RANGE", "RULE", "PREDICATE", "ATOM", "ACTION", "SET", "NOT_SET", "WILDCARD", "PRECEDENCE"];

	Transition.serializationTypes = {
	  EpsilonTransition: Transition.EPSILON,
	  RangeTransition: Transition.RANGE,
	  RuleTransition: Transition.RULE,
	  PredicateTransition: Transition.PREDICATE,
	  AtomTransition: Transition.ATOM,
	  ActionTransition: Transition.ACTION,
	  SetTransition: Transition.SET,
	  NotSetTransition: Transition.NOT_SET,
	  WildcardTransition: Transition.WILDCARD,
	  PrecedencePredicateTransition: Transition.PRECEDENCE
	};

	// TODO: make all transitions sets? no, should remove set edges
	function AtomTransition(target, label) {
	  Transition.call(this, target);
	  this.label_ = label; // The token type or character value; or, signifies special label.
	  this.label = this.makeLabel();
	  this.serializationType = Transition.ATOM;
	  return this;
	}

	AtomTransition.prototype = Object.create(Transition.prototype);
	AtomTransition.prototype.constructor = AtomTransition;

	AtomTransition.prototype.makeLabel = function () {
	  var s = new IntervalSet();
	  s.addOne(this.label_);
	  return s;
	};

	AtomTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
	  return this.label_ === symbol;
	};

	AtomTransition.prototype.toString = function () {
	  return this.label_;
	};

	function RuleTransition(ruleStart, ruleIndex, precedence, followState) {
	  Transition.call(this, ruleStart);
	  this.ruleIndex = ruleIndex; // ptr to the rule definition object for this rule ref
	  this.precedence = precedence;
	  this.followState = followState; // what node to begin computations following ref to rule
	  this.serializationType = Transition.RULE;
	  this.isEpsilon = true;
	  return this;
	}

	RuleTransition.prototype = Object.create(Transition.prototype);
	RuleTransition.prototype.constructor = RuleTransition;

	RuleTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
	  return false;
	};

	function EpsilonTransition(target, outermostPrecedenceReturn) {
	  Transition.call(this, target);
	  this.serializationType = Transition.EPSILON;
	  this.isEpsilon = true;
	  this.outermostPrecedenceReturn = outermostPrecedenceReturn;
	  return this;
	}

	EpsilonTransition.prototype = Object.create(Transition.prototype);
	EpsilonTransition.prototype.constructor = EpsilonTransition;

	EpsilonTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
	  return false;
	};

	EpsilonTransition.prototype.toString = function () {
	  return "epsilon";
	};

	function RangeTransition(target, start, stop) {
	  Transition.call(this, target);
	  this.serializationType = Transition.RANGE;
	  this.start = start;
	  this.stop = stop;
	  this.label = this.makeLabel();
	  return this;
	}

	RangeTransition.prototype = Object.create(Transition.prototype);
	RangeTransition.prototype.constructor = RangeTransition;

	RangeTransition.prototype.makeLabel = function () {
	  var s = new IntervalSet();
	  s.addRange(this.start, this.stop);
	  return s;
	};

	RangeTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
	  return symbol >= this.start && symbol <= this.stop;
	};

	RangeTransition.prototype.toString = function () {
	  return "'" + String.fromCharCode(this.start) + "'..'" + String.fromCharCode(this.stop) + "'";
	};

	function AbstractPredicateTransition(target) {
	  Transition.call(this, target);
	  return this;
	}

	AbstractPredicateTransition.prototype = Object.create(Transition.prototype);
	AbstractPredicateTransition.prototype.constructor = AbstractPredicateTransition;

	function PredicateTransition(target, ruleIndex, predIndex, isCtxDependent) {
	  AbstractPredicateTransition.call(this, target);
	  this.serializationType = Transition.PREDICATE;
	  this.ruleIndex = ruleIndex;
	  this.predIndex = predIndex;
	  this.isCtxDependent = isCtxDependent; // e.g., $i ref in pred
	  this.isEpsilon = true;
	  return this;
	}

	PredicateTransition.prototype = Object.create(AbstractPredicateTransition.prototype);
	PredicateTransition.prototype.constructor = PredicateTransition;

	PredicateTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
	  return false;
	};

	PredicateTransition.prototype.getPredicate = function () {
	  return new Predicate(this.ruleIndex, this.predIndex, this.isCtxDependent);
	};

	PredicateTransition.prototype.toString = function () {
	  return "pred_" + this.ruleIndex + ":" + this.predIndex;
	};

	function ActionTransition(target, ruleIndex, actionIndex, isCtxDependent) {
	  Transition.call(this, target);
	  this.serializationType = Transition.ACTION;
	  this.ruleIndex = ruleIndex;
	  this.actionIndex = actionIndex === undefined ? -1 : actionIndex;
	  this.isCtxDependent = isCtxDependent === undefined ? false : isCtxDependent; // e.g., $i ref in pred
	  this.isEpsilon = true;
	  return this;
	}

	ActionTransition.prototype = Object.create(Transition.prototype);
	ActionTransition.prototype.constructor = ActionTransition;

	ActionTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
	  return false;
	};

	ActionTransition.prototype.toString = function () {
	  return "action_" + this.ruleIndex + ":" + this.actionIndex;
	};

	// A transition containing a set of values.
	function SetTransition(target, set) {
	  Transition.call(this, target);
	  this.serializationType = Transition.SET;
	  if (set !== undefined && set !== null) {
	    this.label = set;
	  } else {
	    this.label = new IntervalSet();
	    this.label.addOne(Token.INVALID_TYPE);
	  }
	  return this;
	}

	SetTransition.prototype = Object.create(Transition.prototype);
	SetTransition.prototype.constructor = SetTransition;

	SetTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
	  return this.label.contains(symbol);
	};

	SetTransition.prototype.toString = function () {
	  return this.label.toString();
	};

	function NotSetTransition(target, set) {
	  SetTransition.call(this, target, set);
	  this.serializationType = Transition.NOT_SET;
	  return this;
	}

	NotSetTransition.prototype = Object.create(SetTransition.prototype);
	NotSetTransition.prototype.constructor = NotSetTransition;

	NotSetTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
	  return symbol >= minVocabSymbol && symbol <= maxVocabSymbol && !SetTransition.prototype.matches.call(this, symbol, minVocabSymbol, maxVocabSymbol);
	};

	NotSetTransition.prototype.toString = function () {
	  return '~' + SetTransition.prototype.toString.call(this);
	};

	function WildcardTransition(target) {
	  Transition.call(this, target);
	  this.serializationType = Transition.WILDCARD;
	  return this;
	}

	WildcardTransition.prototype = Object.create(Transition.prototype);
	WildcardTransition.prototype.constructor = WildcardTransition;

	WildcardTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
	  return symbol >= minVocabSymbol && symbol <= maxVocabSymbol;
	};

	WildcardTransition.prototype.toString = function () {
	  return ".";
	};

	function PrecedencePredicateTransition(target, precedence) {
	  AbstractPredicateTransition.call(this, target);
	  this.serializationType = Transition.PRECEDENCE;
	  this.precedence = precedence;
	  this.isEpsilon = true;
	  return this;
	}

	PrecedencePredicateTransition.prototype = Object.create(AbstractPredicateTransition.prototype);
	PrecedencePredicateTransition.prototype.constructor = PrecedencePredicateTransition;

	PrecedencePredicateTransition.prototype.matches = function (symbol, minVocabSymbol, maxVocabSymbol) {
	  return false;
	};

	PrecedencePredicateTransition.prototype.getPredicate = function () {
	  return new PrecedencePredicate(this.precedence);
	};

	PrecedencePredicateTransition.prototype.toString = function () {
	  return this.precedence + " >= _p";
	};

	exports.Transition = Transition;
	exports.AtomTransition = AtomTransition;
	exports.SetTransition = SetTransition;
	exports.NotSetTransition = NotSetTransition;
	exports.RuleTransition = RuleTransition;
	exports.ActionTransition = ActionTransition;
	exports.EpsilonTransition = EpsilonTransition;
	exports.RangeTransition = RangeTransition;
	exports.WildcardTransition = WildcardTransition;
	exports.PredicateTransition = PredicateTransition;
	exports.PrecedencePredicateTransition = PrecedencePredicateTransition;
	exports.AbstractPredicateTransition = AbstractPredicateTransition;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	var RuleContext = __webpack_require__(13).RuleContext;
	var Hash = __webpack_require__(5).Hash;

	function PredictionContext(cachedHashCode) {
		this.cachedHashCode = cachedHashCode;
	}

	// Represents {@code $} in local context prediction, which means wildcard.
	// {@code//+x =//}.
	// /
	PredictionContext.EMPTY = null;

	// Represents {@code $} in an array in full context mode, when {@code $}
	// doesn't mean wildcard: {@code $ + x = [$,x]}. Here,
	// {@code $} = {@link //EMPTY_RETURN_STATE}.
	// /
	PredictionContext.EMPTY_RETURN_STATE = 0x7FFFFFFF;

	PredictionContext.globalNodeCount = 1;
	PredictionContext.id = PredictionContext.globalNodeCount;

	// Stores the computed hash code of this {@link PredictionContext}. The hash
	// code is computed in parts to match the following reference algorithm.
	//
	// <pre>
	// private int referenceHashCode() {
	// int hash = {@link MurmurHash//initialize MurmurHash.initialize}({@link
	// //INITIAL_HASH});
	//
	// for (int i = 0; i &lt; {@link //size()}; i++) {
	// hash = {@link MurmurHash//update MurmurHash.update}(hash, {@link //getParent
	// getParent}(i));
	// }
	//
	// for (int i = 0; i &lt; {@link //size()}; i++) {
	// hash = {@link MurmurHash//update MurmurHash.update}(hash, {@link
	// //getReturnState getReturnState}(i));
	// }
	//
	// hash = {@link MurmurHash//finish MurmurHash.finish}(hash, 2// {@link
	// //size()});
	// return hash;
	// }
	// </pre>
	// /

	// This means only the {@link //EMPTY} context is in set.
	PredictionContext.prototype.isEmpty = function () {
		return this === PredictionContext.EMPTY;
	};

	PredictionContext.prototype.hasEmptyPath = function () {
		return this.getReturnState(this.length - 1) === PredictionContext.EMPTY_RETURN_STATE;
	};

	PredictionContext.prototype.hashCode = function () {
		return this.cachedHashCode;
	};

	PredictionContext.prototype.updateHashCode = function (hash) {
		hash.update(this.cachedHashCode);
	};
	/*
	function calculateHashString(parent, returnState) {
		return "" + parent + returnState;
	}
	*/

	// Used to cache {@link PredictionContext} objects. Its used for the shared
	// context cash associated with contexts in DFA states. This cache
	// can be used for both lexers and parsers.

	function PredictionContextCache() {
		this.cache = {};
		return this;
	}

	// Add a context to the cache and return it. If the context already exists,
	// return that one instead and do not add a new context to the cache.
	// Protect shared cache from unsafe thread access.
	//
	PredictionContextCache.prototype.add = function (ctx) {
		if (ctx === PredictionContext.EMPTY) {
			return PredictionContext.EMPTY;
		}
		var existing = this.cache[ctx] || null;
		if (existing !== null) {
			return existing;
		}
		this.cache[ctx] = ctx;
		return ctx;
	};

	PredictionContextCache.prototype.get = function (ctx) {
		return this.cache[ctx] || null;
	};

	Object.defineProperty(PredictionContextCache.prototype, "length", {
		get: function get() {
			return this.cache.length;
		}
	});

	function SingletonPredictionContext(parent, returnState) {
		var hashCode = 0;
		if (parent !== null) {
			var hash = new Hash();
			hash.update(parent, returnState);
			hashCode = hash.finish();
		}
		PredictionContext.call(this, hashCode);
		this.parentCtx = parent;
		this.returnState = returnState;
	}

	SingletonPredictionContext.prototype = Object.create(PredictionContext.prototype);
	SingletonPredictionContext.prototype.contructor = SingletonPredictionContext;

	SingletonPredictionContext.create = function (parent, returnState) {
		if (returnState === PredictionContext.EMPTY_RETURN_STATE && parent === null) {
			// someone can pass in the bits of an array ctx that mean $
			return PredictionContext.EMPTY;
		} else {
			return new SingletonPredictionContext(parent, returnState);
		}
	};

	Object.defineProperty(SingletonPredictionContext.prototype, "length", {
		get: function get() {
			return 1;
		}
	});

	SingletonPredictionContext.prototype.getParent = function (index) {
		return this.parentCtx;
	};

	SingletonPredictionContext.prototype.getReturnState = function (index) {
		return this.returnState;
	};

	SingletonPredictionContext.prototype.equals = function (other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof SingletonPredictionContext)) {
			return false;
		} else if (this.hashCode() !== other.hashCode()) {
			return false; // can't be same if hash is different
		} else {
			if (this.returnState !== other.returnState) return false;else if (this.parentCtx == null) return other.parentCtx == null;else return this.parentCtx.equals(other.parentCtx);
		}
	};

	SingletonPredictionContext.prototype.toString = function () {
		var up = this.parentCtx === null ? "" : this.parentCtx.toString();
		if (up.length === 0) {
			if (this.returnState === PredictionContext.EMPTY_RETURN_STATE) {
				return "$";
			} else {
				return "" + this.returnState;
			}
		} else {
			return "" + this.returnState + " " + up;
		}
	};

	function EmptyPredictionContext() {
		SingletonPredictionContext.call(this, null, PredictionContext.EMPTY_RETURN_STATE);
		return this;
	}

	EmptyPredictionContext.prototype = Object.create(SingletonPredictionContext.prototype);
	EmptyPredictionContext.prototype.constructor = EmptyPredictionContext;

	EmptyPredictionContext.prototype.isEmpty = function () {
		return true;
	};

	EmptyPredictionContext.prototype.getParent = function (index) {
		return null;
	};

	EmptyPredictionContext.prototype.getReturnState = function (index) {
		return this.returnState;
	};

	EmptyPredictionContext.prototype.equals = function (other) {
		return this === other;
	};

	EmptyPredictionContext.prototype.toString = function () {
		return "$";
	};

	PredictionContext.EMPTY = new EmptyPredictionContext();

	function ArrayPredictionContext(parents, returnStates) {
		// Parent can be null only if full ctx mode and we make an array
		// from {@link //EMPTY} and non-empty. We merge {@link //EMPTY} by using
		// null parent and
		// returnState == {@link //EMPTY_RETURN_STATE}.
		var h = new Hash();
		h.update(parents, returnStates);
		var hashCode = h.finish();
		PredictionContext.call(this, hashCode);
		this.parents = parents;
		this.returnStates = returnStates;
		return this;
	}

	ArrayPredictionContext.prototype = Object.create(PredictionContext.prototype);
	ArrayPredictionContext.prototype.constructor = ArrayPredictionContext;

	ArrayPredictionContext.prototype.isEmpty = function () {
		// since EMPTY_RETURN_STATE can only appear in the last position, we
		// don't need to verify that size==1
		return this.returnStates[0] === PredictionContext.EMPTY_RETURN_STATE;
	};

	Object.defineProperty(ArrayPredictionContext.prototype, "length", {
		get: function get() {
			return this.returnStates.length;
		}
	});

	ArrayPredictionContext.prototype.getParent = function (index) {
		return this.parents[index];
	};

	ArrayPredictionContext.prototype.getReturnState = function (index) {
		return this.returnStates[index];
	};

	ArrayPredictionContext.prototype.equals = function (other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof ArrayPredictionContext)) {
			return false;
		} else if (this.hashCode() !== other.hashCode()) {
			return false; // can't be same if hash is different
		} else {
			return this.returnStates === other.returnStates && this.parents === other.parents;
		}
	};

	ArrayPredictionContext.prototype.toString = function () {
		if (this.isEmpty()) {
			return "[]";
		} else {
			var s = "[";
			for (var i = 0; i < this.returnStates.length; i++) {
				if (i > 0) {
					s = s + ", ";
				}
				if (this.returnStates[i] === PredictionContext.EMPTY_RETURN_STATE) {
					s = s + "$";
					continue;
				}
				s = s + this.returnStates[i];
				if (this.parents[i] !== null) {
					s = s + " " + this.parents[i];
				} else {
					s = s + "null";
				}
			}
			return s + "]";
		}
	};

	// Convert a {@link RuleContext} tree to a {@link PredictionContext} graph.
	// Return {@link //EMPTY} if {@code outerContext} is empty or null.
	// /
	function predictionContextFromRuleContext(atn, outerContext) {
		if (outerContext === undefined || outerContext === null) {
			outerContext = RuleContext.EMPTY;
		}
		// if we are in RuleContext of start rule, s, then PredictionContext
		// is EMPTY. Nobody called us. (if we are empty, return empty)
		if (outerContext.parentCtx === null || outerContext === RuleContext.EMPTY) {
			return PredictionContext.EMPTY;
		}
		// If we have a parent, convert it to a PredictionContext graph
		var parent = predictionContextFromRuleContext(atn, outerContext.parentCtx);
		var state = atn.states[outerContext.invokingState];
		var transition = state.transitions[0];
		return SingletonPredictionContext.create(parent, transition.followState.stateNumber);
	}
	/*
	function calculateListsHashString(parents, returnStates) {
		var s = "";
		parents.map(function(p) {
			s = s + p;
		});
		returnStates.map(function(r) {
			s = s + r;
		});
		return s;
	}
	*/
	function merge(a, b, rootIsWildcard, mergeCache) {
		// share same graph if both same
		if (a === b) {
			return a;
		}
		if (a instanceof SingletonPredictionContext && b instanceof SingletonPredictionContext) {
			return mergeSingletons(a, b, rootIsWildcard, mergeCache);
		}
		// At least one of a or b is array
		// If one is $ and rootIsWildcard, return $ as// wildcard
		if (rootIsWildcard) {
			if (a instanceof EmptyPredictionContext) {
				return a;
			}
			if (b instanceof EmptyPredictionContext) {
				return b;
			}
		}
		// convert singleton so both are arrays to normalize
		if (a instanceof SingletonPredictionContext) {
			a = new ArrayPredictionContext([a.getParent()], [a.returnState]);
		}
		if (b instanceof SingletonPredictionContext) {
			b = new ArrayPredictionContext([b.getParent()], [b.returnState]);
		}
		return mergeArrays(a, b, rootIsWildcard, mergeCache);
	}

	//
	// Merge two {@link SingletonPredictionContext} instances.
	//
	// <p>Stack tops equal, parents merge is same; return left graph.<br>
	// <embed src="images/SingletonMerge_SameRootSamePar.svg"
	// type="image/svg+xml"/></p>
	//
	// <p>Same stack top, parents differ; merge parents giving array node, then
	// remainders of those graphs. A new root node is created to point to the
	// merged parents.<br>
	// <embed src="images/SingletonMerge_SameRootDiffPar.svg"
	// type="image/svg+xml"/></p>
	//
	// <p>Different stack tops pointing to same parent. Make array node for the
	// root where both element in the root point to the same (original)
	// parent.<br>
	// <embed src="images/SingletonMerge_DiffRootSamePar.svg"
	// type="image/svg+xml"/></p>
	//
	// <p>Different stack tops pointing to different parents. Make array node for
	// the root where each element points to the corresponding original
	// parent.<br>
	// <embed src="images/SingletonMerge_DiffRootDiffPar.svg"
	// type="image/svg+xml"/></p>
	//
	// @param a the first {@link SingletonPredictionContext}
	// @param b the second {@link SingletonPredictionContext}
	// @param rootIsWildcard {@code true} if this is a local-context merge,
	// otherwise false to indicate a full-context merge
	// @param mergeCache
	// /
	function mergeSingletons(a, b, rootIsWildcard, mergeCache) {
		if (mergeCache !== null) {
			var previous = mergeCache.get(a, b);
			if (previous !== null) {
				return previous;
			}
			previous = mergeCache.get(b, a);
			if (previous !== null) {
				return previous;
			}
		}

		var rootMerge = mergeRoot(a, b, rootIsWildcard);
		if (rootMerge !== null) {
			if (mergeCache !== null) {
				mergeCache.set(a, b, rootMerge);
			}
			return rootMerge;
		}
		if (a.returnState === b.returnState) {
			var parent = merge(a.parentCtx, b.parentCtx, rootIsWildcard, mergeCache);
			// if parent is same as existing a or b parent or reduced to a parent,
			// return it
			if (parent === a.parentCtx) {
				return a; // ax + bx = ax, if a=b
			}
			if (parent === b.parentCtx) {
				return b; // ax + bx = bx, if a=b
			}
			// else: ax + ay = a'[x,y]
			// merge parents x and y, giving array node with x,y then remainders
			// of those graphs. dup a, a' points at merged array
			// new joined parent so create new singleton pointing to it, a'
			var spc = SingletonPredictionContext.create(parent, a.returnState);
			if (mergeCache !== null) {
				mergeCache.set(a, b, spc);
			}
			return spc;
		} else {
			// a != b payloads differ
			// see if we can collapse parents due to $+x parents if local ctx
			var singleParent = null;
			if (a === b || a.parentCtx !== null && a.parentCtx === b.parentCtx) {
				// ax +
				// bx =
				// [a,b]x
				singleParent = a.parentCtx;
			}
			if (singleParent !== null) {
				// parents are same
				// sort payloads and use same parent
				var payloads = [a.returnState, b.returnState];
				if (a.returnState > b.returnState) {
					payloads[0] = b.returnState;
					payloads[1] = a.returnState;
				}
				var parents = [singleParent, singleParent];
				var apc = new ArrayPredictionContext(parents, payloads);
				if (mergeCache !== null) {
					mergeCache.set(a, b, apc);
				}
				return apc;
			}
			// parents differ and can't merge them. Just pack together
			// into array; can't merge.
			// ax + by = [ax,by]
			var payloads = [a.returnState, b.returnState];
			var parents = [a.parentCtx, b.parentCtx];
			if (a.returnState > b.returnState) {
				// sort by payload
				payloads[0] = b.returnState;
				payloads[1] = a.returnState;
				parents = [b.parentCtx, a.parentCtx];
			}
			var a_ = new ArrayPredictionContext(parents, payloads);
			if (mergeCache !== null) {
				mergeCache.set(a, b, a_);
			}
			return a_;
		}
	}

	//
	// Handle case where at least one of {@code a} or {@code b} is
	// {@link //EMPTY}. In the following diagrams, the symbol {@code $} is used
	// to represent {@link //EMPTY}.
	//
	// <h2>Local-Context Merges</h2>
	//
	// <p>These local-context merge operations are used when {@code rootIsWildcard}
	// is true.</p>
	//
	// <p>{@link //EMPTY} is superset of any graph; return {@link //EMPTY}.<br>
	// <embed src="images/LocalMerge_EmptyRoot.svg" type="image/svg+xml"/></p>
	//
	// <p>{@link //EMPTY} and anything is {@code //EMPTY}, so merged parent is
	// {@code //EMPTY}; return left graph.<br>
	// <embed src="images/LocalMerge_EmptyParent.svg" type="image/svg+xml"/></p>
	//
	// <p>Special case of last merge if local context.<br>
	// <embed src="images/LocalMerge_DiffRoots.svg" type="image/svg+xml"/></p>
	//
	// <h2>Full-Context Merges</h2>
	//
	// <p>These full-context merge operations are used when {@code rootIsWildcard}
	// is false.</p>
	//
	// <p><embed src="images/FullMerge_EmptyRoots.svg" type="image/svg+xml"/></p>
	//
	// <p>Must keep all contexts; {@link //EMPTY} in array is a special value (and
	// null parent).<br>
	// <embed src="images/FullMerge_EmptyRoot.svg" type="image/svg+xml"/></p>
	//
	// <p><embed src="images/FullMerge_SameRoot.svg" type="image/svg+xml"/></p>
	//
	// @param a the first {@link SingletonPredictionContext}
	// @param b the second {@link SingletonPredictionContext}
	// @param rootIsWildcard {@code true} if this is a local-context merge,
	// otherwise false to indicate a full-context merge
	// /
	function mergeRoot(a, b, rootIsWildcard) {
		if (rootIsWildcard) {
			if (a === PredictionContext.EMPTY) {
				return PredictionContext.EMPTY; // // + b =//
			}
			if (b === PredictionContext.EMPTY) {
				return PredictionContext.EMPTY; // a +// =//
			}
		} else {
			if (a === PredictionContext.EMPTY && b === PredictionContext.EMPTY) {
				return PredictionContext.EMPTY; // $ + $ = $
			} else if (a === PredictionContext.EMPTY) {
				// $ + x = [$,x]
				var payloads = [b.returnState, PredictionContext.EMPTY_RETURN_STATE];
				var parents = [b.parentCtx, null];
				return new ArrayPredictionContext(parents, payloads);
			} else if (b === PredictionContext.EMPTY) {
				// x + $ = [$,x] ($ is always first if present)
				var payloads = [a.returnState, PredictionContext.EMPTY_RETURN_STATE];
				var parents = [a.parentCtx, null];
				return new ArrayPredictionContext(parents, payloads);
			}
		}
		return null;
	}

	//
	// Merge two {@link ArrayPredictionContext} instances.
	//
	// <p>Different tops, different parents.<br>
	// <embed src="images/ArrayMerge_DiffTopDiffPar.svg" type="image/svg+xml"/></p>
	//
	// <p>Shared top, same parents.<br>
	// <embed src="images/ArrayMerge_ShareTopSamePar.svg" type="image/svg+xml"/></p>
	//
	// <p>Shared top, different parents.<br>
	// <embed src="images/ArrayMerge_ShareTopDiffPar.svg" type="image/svg+xml"/></p>
	//
	// <p>Shared top, all shared parents.<br>
	// <embed src="images/ArrayMerge_ShareTopSharePar.svg"
	// type="image/svg+xml"/></p>
	//
	// <p>Equal tops, merge parents and reduce top to
	// {@link SingletonPredictionContext}.<br>
	// <embed src="images/ArrayMerge_EqualTop.svg" type="image/svg+xml"/></p>
	// /
	function mergeArrays(a, b, rootIsWildcard, mergeCache) {
		if (mergeCache !== null) {
			var previous = mergeCache.get(a, b);
			if (previous !== null) {
				return previous;
			}
			previous = mergeCache.get(b, a);
			if (previous !== null) {
				return previous;
			}
		}
		// merge sorted payloads a + b => M
		var i = 0; // walks a
		var j = 0; // walks b
		var k = 0; // walks target M array

		var mergedReturnStates = [];
		var mergedParents = [];
		// walk and merge to yield mergedParents, mergedReturnStates
		while (i < a.returnStates.length && j < b.returnStates.length) {
			var a_parent = a.parents[i];
			var b_parent = b.parents[j];
			if (a.returnStates[i] === b.returnStates[j]) {
				// same payload (stack tops are equal), must yield merged singleton
				var payload = a.returnStates[i];
				// $+$ = $
				var bothDollars = payload === PredictionContext.EMPTY_RETURN_STATE && a_parent === null && b_parent === null;
				var ax_ax = a_parent !== null && b_parent !== null && a_parent === b_parent; // ax+ax
				// ->
				// ax
				if (bothDollars || ax_ax) {
					mergedParents[k] = a_parent; // choose left
					mergedReturnStates[k] = payload;
				} else {
					// ax+ay -> a'[x,y]
					var mergedParent = merge(a_parent, b_parent, rootIsWildcard, mergeCache);
					mergedParents[k] = mergedParent;
					mergedReturnStates[k] = payload;
				}
				i += 1; // hop over left one as usual
				j += 1; // but also skip one in right side since we merge
			} else if (a.returnStates[i] < b.returnStates[j]) {
				// copy a[i] to M
				mergedParents[k] = a_parent;
				mergedReturnStates[k] = a.returnStates[i];
				i += 1;
			} else {
				// b > a, copy b[j] to M
				mergedParents[k] = b_parent;
				mergedReturnStates[k] = b.returnStates[j];
				j += 1;
			}
			k += 1;
		}
		// copy over any payloads remaining in either array
		if (i < a.returnStates.length) {
			for (var p = i; p < a.returnStates.length; p++) {
				mergedParents[k] = a.parents[p];
				mergedReturnStates[k] = a.returnStates[p];
				k += 1;
			}
		} else {
			for (var p = j; p < b.returnStates.length; p++) {
				mergedParents[k] = b.parents[p];
				mergedReturnStates[k] = b.returnStates[p];
				k += 1;
			}
		}
		// trim merged if we combined a few that had same stack tops
		if (k < mergedParents.length) {
			// write index < last position; trim
			if (k === 1) {
				// for just one merged element, return singleton top
				var a_ = SingletonPredictionContext.create(mergedParents[0], mergedReturnStates[0]);
				if (mergeCache !== null) {
					mergeCache.set(a, b, a_);
				}
				return a_;
			}
			mergedParents = mergedParents.slice(0, k);
			mergedReturnStates = mergedReturnStates.slice(0, k);
		}

		var M = new ArrayPredictionContext(mergedParents, mergedReturnStates);

		// if we created same array as a or b, return that instead
		// TODO: track whether this is possible above during merge sort for speed
		if (M === a) {
			if (mergeCache !== null) {
				mergeCache.set(a, b, a);
			}
			return a;
		}
		if (M === b) {
			if (mergeCache !== null) {
				mergeCache.set(a, b, b);
			}
			return b;
		}
		combineCommonParents(mergedParents);

		if (mergeCache !== null) {
			mergeCache.set(a, b, M);
		}
		return M;
	}

	//
	// Make pass over all <em>M</em> {@code parents}; merge any {@code equals()}
	// ones.
	// /
	function combineCommonParents(parents) {
		var uniqueParents = {};

		for (var p = 0; p < parents.length; p++) {
			var parent = parents[p];
			if (!(parent in uniqueParents)) {
				uniqueParents[parent] = parent;
			}
		}
		for (var q = 0; q < parents.length; q++) {
			parents[q] = uniqueParents[parents[q]];
		}
	}

	function getCachedPredictionContext(context, contextCache, visited) {
		if (context.isEmpty()) {
			return context;
		}
		var existing = visited[context] || null;
		if (existing !== null) {
			return existing;
		}
		existing = contextCache.get(context);
		if (existing !== null) {
			visited[context] = existing;
			return existing;
		}
		var changed = false;
		var parents = [];
		for (var i = 0; i < parents.length; i++) {
			var parent = getCachedPredictionContext(context.getParent(i), contextCache, visited);
			if (changed || parent !== context.getParent(i)) {
				if (!changed) {
					parents = [];
					for (var j = 0; j < context.length; j++) {
						parents[j] = context.getParent(j);
					}
					changed = true;
				}
				parents[i] = parent;
			}
		}
		if (!changed) {
			contextCache.add(context);
			visited[context] = context;
			return context;
		}
		var updated = null;
		if (parents.length === 0) {
			updated = PredictionContext.EMPTY;
		} else if (parents.length === 1) {
			updated = SingletonPredictionContext.create(parents[0], context.getReturnState(0));
		} else {
			updated = new ArrayPredictionContext(parents, context.returnStates);
		}
		contextCache.add(updated);
		visited[updated] = updated;
		visited[context] = updated;

		return updated;
	}

	// ter's recursive version of Sam's getAllNodes()
	function getAllContextNodes(context, nodes, visited) {
		if (nodes === null) {
			nodes = [];
			return getAllContextNodes(context, nodes, visited);
		} else if (visited === null) {
			visited = {};
			return getAllContextNodes(context, nodes, visited);
		} else {
			if (context === null || visited[context] !== null) {
				return nodes;
			}
			visited[context] = context;
			nodes.push(context);
			for (var i = 0; i < context.length; i++) {
				getAllContextNodes(context.getParent(i), nodes, visited);
			}
			return nodes;
		}
	}

	exports.merge = merge;
	exports.PredictionContext = PredictionContext;
	exports.PredictionContextCache = PredictionContextCache;
	exports.SingletonPredictionContext = SingletonPredictionContext;
	exports.predictionContextFromRuleContext = predictionContextFromRuleContext;
	exports.getCachedPredictionContext = getCachedPredictionContext;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	//  A rule context is a record of a single rule invocation. It knows
	//  which context invoked it, if any. If there is no parent context, then
	//  naturally the invoking state is not valid.  The parent link
	//  provides a chain upwards from the current rule invocation to the root
	//  of the invocation tree, forming a stack. We actually carry no
	//  information about the rule associated with this context (except
	//  when parsing). We keep only the state number of the invoking state from
	//  the ATN submachine that invoked this. Contrast this with the s
	//  pointer inside ParserRuleContext that tracks the current state
	//  being "executed" for the current rule.
	//
	//  The parent contexts are useful for computing lookahead sets and
	//  getting error information.
	//
	//  These objects are used during parsing and prediction.
	//  For the special case of parsers, we use the subclass
	//  ParserRuleContext.
	//
	//  @see ParserRuleContext
	///

	var RuleNode = __webpack_require__(14).RuleNode;
	var INVALID_INTERVAL = __webpack_require__(14).INVALID_INTERVAL;
	var INVALID_ALT_NUMBER = __webpack_require__(3).INVALID_ALT_NUMBER;

	function RuleContext(parent, invokingState) {
		RuleNode.call(this);
		// What context invoked this rule?
		this.parentCtx = parent || null;
		// What state invoked the rule associated with this context?
		// The "return address" is the followState of invokingState
		// If parent is null, this should be -1.
		this.invokingState = invokingState || -1;
		return this;
	}

	RuleContext.prototype = Object.create(RuleNode.prototype);
	RuleContext.prototype.constructor = RuleContext;

	RuleContext.prototype.depth = function () {
		var n = 0;
		var p = this;
		while (p !== null) {
			p = p.parentCtx;
			n += 1;
		}
		return n;
	};

	// A context is empty if there is no invoking state; meaning nobody call
	// current context.
	RuleContext.prototype.isEmpty = function () {
		return this.invokingState === -1;
	};

	// satisfy the ParseTree / SyntaxTree interface

	RuleContext.prototype.getSourceInterval = function () {
		return INVALID_INTERVAL;
	};

	RuleContext.prototype.getRuleContext = function () {
		return this;
	};

	RuleContext.prototype.getPayload = function () {
		return this;
	};

	// Return the combined text of all child nodes. This method only considers
	// tokens which have been added to the parse tree.
	// <p>
	// Since tokens on hidden channels (e.g. whitespace or comments) are not
	// added to the parse trees, they will not appear in the output of this
	// method.
	// /
	RuleContext.prototype.getText = function () {
		if (this.getChildCount() === 0) {
			return "";
		} else {
			return this.children.map(function (child) {
				return child.getText();
			}).join("");
		}
	};

	// For rule associated with this parse tree internal node, return
	// the outer alternative number used to match the input. Default
	// implementation does not compute nor store this alt num. Create
	// a subclass of ParserRuleContext with backing field and set
	// option contextSuperClass.
	// to set it.
	RuleContext.prototype.getAltNumber = function () {
		return INVALID_ALT_NUMBER;
	};

	// Set the outer alternative number for this context node. Default
	// implementation does nothing to avoid backing field overhead for
	// trees that don't need it.  Create
	// a subclass of ParserRuleContext with backing field and set
	// option contextSuperClass.
	RuleContext.prototype.setAltNumber = function (altNumber) {};

	RuleContext.prototype.getChild = function (i) {
		return null;
	};

	RuleContext.prototype.getChildCount = function () {
		return 0;
	};

	RuleContext.prototype.accept = function (visitor) {
		return visitor.visitChildren(this);
	};

	//need to manage circular dependencies, so export now
	exports.RuleContext = RuleContext;
	var Trees = __webpack_require__(15).Trees;

	// Print out a whole tree, not just a node, in LISP format
	// (root child1 .. childN). Print just a node if this is a leaf.
	//

	RuleContext.prototype.toStringTree = function (ruleNames, recog) {
		return Trees.toStringTree(this, ruleNames, recog);
	};

	RuleContext.prototype.toString = function (ruleNames, stop) {
		ruleNames = ruleNames || null;
		stop = stop || null;
		var p = this;
		var s = "[";
		while (p !== null && p !== stop) {
			if (ruleNames === null) {
				if (!p.isEmpty()) {
					s += p.invokingState;
				}
			} else {
				var ri = p.ruleIndex;
				var ruleName = ri >= 0 && ri < ruleNames.length ? ruleNames[ri] : "" + ri;
				s += ruleName;
			}
			if (p.parentCtx !== null && (ruleNames !== null || !p.parentCtx.isEmpty())) {
				s += " ";
			}
			p = p.parentCtx;
		}
		s += "]";
		return s;
	};

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	// The basic notion of a tree has a parent, a payload, and a list of children.
	//  It is the most abstract interface for all the trees used by ANTLR.
	///

	var Token = __webpack_require__(6).Token;
	var Interval = __webpack_require__(10).Interval;
	var INVALID_INTERVAL = new Interval(-1, -2);
	var Utils = __webpack_require__(5);

	function Tree() {
		return this;
	}

	function SyntaxTree() {
		Tree.call(this);
		return this;
	}

	SyntaxTree.prototype = Object.create(Tree.prototype);
	SyntaxTree.prototype.constructor = SyntaxTree;

	function ParseTree() {
		SyntaxTree.call(this);
		return this;
	}

	ParseTree.prototype = Object.create(SyntaxTree.prototype);
	ParseTree.prototype.constructor = ParseTree;

	function RuleNode() {
		ParseTree.call(this);
		return this;
	}

	RuleNode.prototype = Object.create(ParseTree.prototype);
	RuleNode.prototype.constructor = RuleNode;

	function TerminalNode() {
		ParseTree.call(this);
		return this;
	}

	TerminalNode.prototype = Object.create(ParseTree.prototype);
	TerminalNode.prototype.constructor = TerminalNode;

	function ErrorNode() {
		TerminalNode.call(this);
		return this;
	}

	ErrorNode.prototype = Object.create(TerminalNode.prototype);
	ErrorNode.prototype.constructor = ErrorNode;

	function ParseTreeVisitor() {
		return this;
	}

	ParseTreeVisitor.prototype.visit = function (ctx) {
		if (Array.isArray(ctx)) {
			return ctx.map(function (child) {
				return child.accept(this);
			}, this);
		} else {
			return ctx.accept(this);
		}
	};

	ParseTreeVisitor.prototype.visitChildren = function (ctx) {
		return this.visit(ctx.children);
	};

	ParseTreeVisitor.prototype.visitTerminal = function (node) {};

	ParseTreeVisitor.prototype.visitErrorNode = function (node) {};

	function ParseTreeListener() {
		return this;
	}

	ParseTreeListener.prototype.visitTerminal = function (node) {};

	ParseTreeListener.prototype.visitErrorNode = function (node) {};

	ParseTreeListener.prototype.enterEveryRule = function (node) {};

	ParseTreeListener.prototype.exitEveryRule = function (node) {};

	function TerminalNodeImpl(symbol) {
		TerminalNode.call(this);
		this.parentCtx = null;
		this.symbol = symbol;
		return this;
	}

	TerminalNodeImpl.prototype = Object.create(TerminalNode.prototype);
	TerminalNodeImpl.prototype.constructor = TerminalNodeImpl;

	TerminalNodeImpl.prototype.getChild = function (i) {
		return null;
	};

	TerminalNodeImpl.prototype.getSymbol = function () {
		return this.symbol;
	};

	TerminalNodeImpl.prototype.getParent = function () {
		return this.parentCtx;
	};

	TerminalNodeImpl.prototype.getPayload = function () {
		return this.symbol;
	};

	TerminalNodeImpl.prototype.getSourceInterval = function () {
		if (this.symbol === null) {
			return INVALID_INTERVAL;
		}
		var tokenIndex = this.symbol.tokenIndex;
		return new Interval(tokenIndex, tokenIndex);
	};

	TerminalNodeImpl.prototype.getChildCount = function () {
		return 0;
	};

	TerminalNodeImpl.prototype.accept = function (visitor) {
		return visitor.visitTerminal(this);
	};

	TerminalNodeImpl.prototype.getText = function () {
		return this.symbol.text;
	};

	TerminalNodeImpl.prototype.toString = function () {
		if (this.symbol.type === Token.EOF) {
			return "<EOF>";
		} else {
			return this.symbol.text;
		}
	};

	// Represents a token that was consumed during resynchronization
	// rather than during a valid match operation. For example,
	// we will create this kind of a node during single token insertion
	// and deletion as well as during "consume until error recovery set"
	// upon no viable alternative exceptions.

	function ErrorNodeImpl(token) {
		TerminalNodeImpl.call(this, token);
		return this;
	}

	ErrorNodeImpl.prototype = Object.create(TerminalNodeImpl.prototype);
	ErrorNodeImpl.prototype.constructor = ErrorNodeImpl;

	ErrorNodeImpl.prototype.isErrorNode = function () {
		return true;
	};

	ErrorNodeImpl.prototype.accept = function (visitor) {
		return visitor.visitErrorNode(this);
	};

	function ParseTreeWalker() {
		return this;
	}

	ParseTreeWalker.prototype.walk = function (listener, t) {
		var errorNode = t instanceof ErrorNode || t.isErrorNode !== undefined && t.isErrorNode();
		if (errorNode) {
			listener.visitErrorNode(t);
		} else if (t instanceof TerminalNode) {
			listener.visitTerminal(t);
		} else {
			this.enterRule(listener, t);
			for (var i = 0; i < t.getChildCount(); i++) {
				var child = t.getChild(i);
				this.walk(listener, child);
			}
			this.exitRule(listener, t);
		}
	};
	//
	// The discovery of a rule node, involves sending two events: the generic
	// {@link ParseTreeListener//enterEveryRule} and a
	// {@link RuleContext}-specific event. First we trigger the generic and then
	// the rule specific. We to them in reverse order upon finishing the node.
	//
	ParseTreeWalker.prototype.enterRule = function (listener, r) {
		var ctx = r.getRuleContext();
		listener.enterEveryRule(ctx);
		ctx.enterRule(listener);
	};

	ParseTreeWalker.prototype.exitRule = function (listener, r) {
		var ctx = r.getRuleContext();
		ctx.exitRule(listener);
		listener.exitEveryRule(ctx);
	};

	ParseTreeWalker.DEFAULT = new ParseTreeWalker();

	exports.RuleNode = RuleNode;
	exports.ErrorNode = ErrorNode;
	exports.TerminalNode = TerminalNode;
	exports.ErrorNodeImpl = ErrorNodeImpl;
	exports.TerminalNodeImpl = TerminalNodeImpl;
	exports.ParseTreeListener = ParseTreeListener;
	exports.ParseTreeVisitor = ParseTreeVisitor;
	exports.ParseTreeWalker = ParseTreeWalker;
	exports.INVALID_INTERVAL = INVALID_INTERVAL;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	var Utils = __webpack_require__(5);
	var Token = __webpack_require__(6).Token;
	var RuleNode = __webpack_require__(14).RuleNode;
	var ErrorNode = __webpack_require__(14).ErrorNode;
	var TerminalNode = __webpack_require__(14).TerminalNode;
	var ParserRuleContext = __webpack_require__(16).ParserRuleContext;
	var RuleContext = __webpack_require__(13).RuleContext;
	var INVALID_ALT_NUMBER = __webpack_require__(3).INVALID_ALT_NUMBER;

	/** A set of utility routines useful for all kinds of ANTLR trees. */
	function Trees() {}

	// Print out a whole tree in LISP form. {@link //getNodeText} is used on the
	//  node payloads to get the text for the nodes.  Detect
	//  parse trees and extract data appropriately.
	Trees.toStringTree = function (tree, ruleNames, recog) {
	    ruleNames = ruleNames || null;
	    recog = recog || null;
	    if (recog !== null) {
	        ruleNames = recog.ruleNames;
	    }
	    var s = Trees.getNodeText(tree, ruleNames);
	    s = Utils.escapeWhitespace(s, false);
	    var c = tree.getChildCount();
	    if (c === 0) {
	        return s;
	    }
	    var res = "(" + s + ' ';
	    if (c > 0) {
	        s = Trees.toStringTree(tree.getChild(0), ruleNames);
	        res = res.concat(s);
	    }
	    for (var i = 1; i < c; i++) {
	        s = Trees.toStringTree(tree.getChild(i), ruleNames);
	        res = res.concat(' ' + s);
	    }
	    res = res.concat(")");
	    return res;
	};

	Trees.getNodeText = function (t, ruleNames, recog) {
	    ruleNames = ruleNames || null;
	    recog = recog || null;
	    if (recog !== null) {
	        ruleNames = recog.ruleNames;
	    }
	    if (ruleNames !== null) {
	        if (t instanceof RuleContext) {
	            var altNumber = t.getAltNumber();
	            if (altNumber != INVALID_ALT_NUMBER) {
	                return ruleNames[t.ruleIndex] + ":" + altNumber;
	            }
	            return ruleNames[t.ruleIndex];
	        } else if (t instanceof ErrorNode) {
	            return t.toString();
	        } else if (t instanceof TerminalNode) {
	            if (t.symbol !== null) {
	                return t.symbol.text;
	            }
	        }
	    }
	    // no recog for rule names
	    var payload = t.getPayload();
	    if (payload instanceof Token) {
	        return payload.text;
	    }
	    return t.getPayload().toString();
	};

	// Return ordered list of all children of this node
	Trees.getChildren = function (t) {
	    var list = [];
	    for (var i = 0; i < t.getChildCount(); i++) {
	        list.push(t.getChild(i));
	    }
	    return list;
	};

	// Return a list of all ancestors of this node.  The first node of
	//  list is the root and the last is the parent of this node.
	//
	Trees.getAncestors = function (t) {
	    var ancestors = [];
	    t = t.getParent();
	    while (t !== null) {
	        ancestors = [t].concat(ancestors);
	        t = t.getParent();
	    }
	    return ancestors;
	};

	Trees.findAllTokenNodes = function (t, ttype) {
	    return Trees.findAllNodes(t, ttype, true);
	};

	Trees.findAllRuleNodes = function (t, ruleIndex) {
	    return Trees.findAllNodes(t, ruleIndex, false);
	};

	Trees.findAllNodes = function (t, index, findTokens) {
	    var nodes = [];
	    Trees._findAllNodes(t, index, findTokens, nodes);
	    return nodes;
	};

	Trees._findAllNodes = function (t, index, findTokens, nodes) {
	    // check this node (the root) first
	    if (findTokens && t instanceof TerminalNode) {
	        if (t.symbol.type === index) {
	            nodes.push(t);
	        }
	    } else if (!findTokens && t instanceof ParserRuleContext) {
	        if (t.ruleIndex === index) {
	            nodes.push(t);
	        }
	    }
	    // check children
	    for (var i = 0; i < t.getChildCount(); i++) {
	        Trees._findAllNodes(t.getChild(i), index, findTokens, nodes);
	    }
	};

	Trees.descendants = function (t) {
	    var nodes = [t];
	    for (var i = 0; i < t.getChildCount(); i++) {
	        nodes = nodes.concat(Trees.descendants(t.getChild(i)));
	    }
	    return nodes;
	};

	exports.Trees = Trees;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	//* A rule invocation record for parsing.
	//
	//  Contains all of the information about the current rule not stored in the
	//  RuleContext. It handles parse tree children list, Any ATN state
	//  tracing, and the default values available for rule indications:
	//  start, stop, rule index, current alt number, current
	//  ATN state.
	//
	//  Subclasses made for each rule and grammar track the parameters,
	//  return values, locals, and labels specific to that rule. These
	//  are the objects that are returned from rules.
	//
	//  Note text is not an actual field of a rule return value; it is computed
	//  from start and stop using the input stream's toString() method.  I
	//  could add a ctor to this so that we can pass in and store the input
	//  stream, but I'm not sure we want to do that.  It would seem to be undefined
	//  to get the .text property anyway if the rule matches tokens from multiple
	//  input streams.
	//
	//  I do not use getters for fields of objects that are used simply to
	//  group values such as this aggregate.  The getters/setters are there to
	//  satisfy the superclass interface.

	var RuleContext = __webpack_require__(13).RuleContext;
	var Tree = __webpack_require__(14);
	var INVALID_INTERVAL = Tree.INVALID_INTERVAL;
	var TerminalNode = Tree.TerminalNode;
	var TerminalNodeImpl = Tree.TerminalNodeImpl;
	var ErrorNodeImpl = Tree.ErrorNodeImpl;
	var Interval = __webpack_require__(10).Interval;

	function ParserRuleContext(parent, invokingStateNumber) {
	  parent = parent || null;
	  invokingStateNumber = invokingStateNumber || null;
	  RuleContext.call(this, parent, invokingStateNumber);
	  this.ruleIndex = -1;
	  // * If we are debugging or building a parse tree for a visitor,
	  // we need to track all of the tokens and rule invocations associated
	  // with this rule's context. This is empty for parsing w/o tree constr.
	  // operation because we don't the need to track the details about
	  // how we parse this rule.
	  // /
	  this.children = null;
	  this.start = null;
	  this.stop = null;
	  // The exception that forced this rule to return. If the rule successfully
	  // completed, this is {@code null}.
	  this.exception = null;
	}

	ParserRuleContext.prototype = Object.create(RuleContext.prototype);
	ParserRuleContext.prototype.constructor = ParserRuleContext;

	// * COPY a ctx (I'm deliberately not using copy constructor)///
	ParserRuleContext.prototype.copyFrom = function (ctx) {
	  // from RuleContext
	  this.parentCtx = ctx.parentCtx;
	  this.invokingState = ctx.invokingState;
	  this.children = null;
	  this.start = ctx.start;
	  this.stop = ctx.stop;
	  // copy any error nodes to alt label node
	  if (ctx.children) {
	    this.children = [];
	    // reset parent pointer for any error nodes
	    ctx.children.map(function (child) {
	      if (child instanceof ErrorNodeImpl) {
	        this.children.push(child);
	        child.parentCtx = this;
	      }
	    }, this);
	  }
	};

	// Double dispatch methods for listeners
	ParserRuleContext.prototype.enterRule = function (listener) {};

	ParserRuleContext.prototype.exitRule = function (listener) {};

	// * Does not set parent link; other add methods do that///
	ParserRuleContext.prototype.addChild = function (child) {
	  if (this.children === null) {
	    this.children = [];
	  }
	  this.children.push(child);
	  return child;
	};

	// * Used by enterOuterAlt to toss out a RuleContext previously added as
	// we entered a rule. If we have // label, we will need to remove
	// generic ruleContext object.
	// /
	ParserRuleContext.prototype.removeLastChild = function () {
	  if (this.children !== null) {
	    this.children.pop();
	  }
	};

	ParserRuleContext.prototype.addTokenNode = function (token) {
	  var node = new TerminalNodeImpl(token);
	  this.addChild(node);
	  node.parentCtx = this;
	  return node;
	};

	ParserRuleContext.prototype.addErrorNode = function (badToken) {
	  var node = new ErrorNodeImpl(badToken);
	  this.addChild(node);
	  node.parentCtx = this;
	  return node;
	};

	ParserRuleContext.prototype.getChild = function (i, type) {
	  type = type || null;
	  if (this.children === null || i < 0 || i >= this.children.length) {
	    return null;
	  }
	  if (type === null) {
	    return this.children[i];
	  } else {
	    for (var j = 0; j < this.children.length; j++) {
	      var child = this.children[j];
	      if (child instanceof type) {
	        if (i === 0) {
	          return child;
	        } else {
	          i -= 1;
	        }
	      }
	    }
	    return null;
	  }
	};

	ParserRuleContext.prototype.getToken = function (ttype, i) {
	  if (this.children === null || i < 0 || i >= this.children.length) {
	    return null;
	  }
	  for (var j = 0; j < this.children.length; j++) {
	    var child = this.children[j];
	    if (child instanceof TerminalNode) {
	      if (child.symbol.type === ttype) {
	        if (i === 0) {
	          return child;
	        } else {
	          i -= 1;
	        }
	      }
	    }
	  }
	  return null;
	};

	ParserRuleContext.prototype.getTokens = function (ttype) {
	  if (this.children === null) {
	    return [];
	  } else {
	    var tokens = [];
	    for (var j = 0; j < this.children.length; j++) {
	      var child = this.children[j];
	      if (child instanceof TerminalNode) {
	        if (child.symbol.type === ttype) {
	          tokens.push(child);
	        }
	      }
	    }
	    return tokens;
	  }
	};

	ParserRuleContext.prototype.getTypedRuleContext = function (ctxType, i) {
	  return this.getChild(i, ctxType);
	};

	ParserRuleContext.prototype.getTypedRuleContexts = function (ctxType) {
	  if (this.children === null) {
	    return [];
	  } else {
	    var contexts = [];
	    for (var j = 0; j < this.children.length; j++) {
	      var child = this.children[j];
	      if (child instanceof ctxType) {
	        contexts.push(child);
	      }
	    }
	    return contexts;
	  }
	};

	ParserRuleContext.prototype.getChildCount = function () {
	  if (this.children === null) {
	    return 0;
	  } else {
	    return this.children.length;
	  }
	};

	ParserRuleContext.prototype.getSourceInterval = function () {
	  if (this.start === null || this.stop === null) {
	    return INVALID_INTERVAL;
	  } else {
	    return new Interval(this.start.tokenIndex, this.stop.tokenIndex);
	  }
	};

	RuleContext.EMPTY = new ParserRuleContext();

	function InterpreterRuleContext(parent, invokingStateNumber, ruleIndex) {
	  ParserRuleContext.call(parent, invokingStateNumber);
	  this.ruleIndex = ruleIndex;
	  return this;
	}

	InterpreterRuleContext.prototype = Object.create(ParserRuleContext.prototype);
	InterpreterRuleContext.prototype.constructor = InterpreterRuleContext;

	exports.ParserRuleContext = ParserRuleContext;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	var Token = __webpack_require__(6).Token;
	var ATN = __webpack_require__(3).ATN;
	var ATNType = __webpack_require__(18).ATNType;
	var ATNStates = __webpack_require__(8);
	var ATNState = ATNStates.ATNState;
	var BasicState = ATNStates.BasicState;
	var DecisionState = ATNStates.DecisionState;
	var BlockStartState = ATNStates.BlockStartState;
	var BlockEndState = ATNStates.BlockEndState;
	var LoopEndState = ATNStates.LoopEndState;
	var RuleStartState = ATNStates.RuleStartState;
	var RuleStopState = ATNStates.RuleStopState;
	var TokensStartState = ATNStates.TokensStartState;
	var PlusLoopbackState = ATNStates.PlusLoopbackState;
	var StarLoopbackState = ATNStates.StarLoopbackState;
	var StarLoopEntryState = ATNStates.StarLoopEntryState;
	var PlusBlockStartState = ATNStates.PlusBlockStartState;
	var StarBlockStartState = ATNStates.StarBlockStartState;
	var BasicBlockStartState = ATNStates.BasicBlockStartState;
	var Transitions = __webpack_require__(11);
	var Transition = Transitions.Transition;
	var AtomTransition = Transitions.AtomTransition;
	var SetTransition = Transitions.SetTransition;
	var NotSetTransition = Transitions.NotSetTransition;
	var RuleTransition = Transitions.RuleTransition;
	var RangeTransition = Transitions.RangeTransition;
	var ActionTransition = Transitions.ActionTransition;
	var EpsilonTransition = Transitions.EpsilonTransition;
	var WildcardTransition = Transitions.WildcardTransition;
	var PredicateTransition = Transitions.PredicateTransition;
	var PrecedencePredicateTransition = Transitions.PrecedencePredicateTransition;
	var IntervalSet = __webpack_require__(10).IntervalSet;
	var Interval = __webpack_require__(10).Interval;
	var ATNDeserializationOptions = __webpack_require__(19).ATNDeserializationOptions;
	var LexerActions = __webpack_require__(20);
	var LexerActionType = LexerActions.LexerActionType;
	var LexerSkipAction = LexerActions.LexerSkipAction;
	var LexerChannelAction = LexerActions.LexerChannelAction;
	var LexerCustomAction = LexerActions.LexerCustomAction;
	var LexerMoreAction = LexerActions.LexerMoreAction;
	var LexerTypeAction = LexerActions.LexerTypeAction;
	var LexerPushModeAction = LexerActions.LexerPushModeAction;
	var LexerPopModeAction = LexerActions.LexerPopModeAction;
	var LexerModeAction = LexerActions.LexerModeAction;
	// This is the earliest supported serialized UUID.
	// stick to serialized version for now, we don't need a UUID instance
	var BASE_SERIALIZED_UUID = "AADB8D7E-AEEF-4415-AD2B-8204D6CF042E";

	//
	// This UUID indicates the serialized ATN contains two sets of
	// IntervalSets, where the second set's values are encoded as
	// 32-bit integers to support the full Unicode SMP range up to U+10FFFF.
	//
	var ADDED_UNICODE_SMP = "59627784-3BE5-417A-B9EB-8131A7286089";

	// This list contains all of the currently supported UUIDs, ordered by when
	// the feature first appeared in this branch.
	var SUPPORTED_UUIDS = [BASE_SERIALIZED_UUID, ADDED_UNICODE_SMP];

	var SERIALIZED_VERSION = 3;

	// This is the current serialized UUID.
	var SERIALIZED_UUID = ADDED_UNICODE_SMP;

	function initArray(length, value) {
	    var tmp = [];
	    tmp[length - 1] = value;
	    return tmp.map(function (i) {
	        return value;
	    });
	}

	function ATNDeserializer(options) {

	    if (options === undefined || options === null) {
	        options = ATNDeserializationOptions.defaultOptions;
	    }
	    this.deserializationOptions = options;
	    this.stateFactories = null;
	    this.actionFactories = null;

	    return this;
	}

	// Determines if a particular serialized representation of an ATN supports
	// a particular feature, identified by the {@link UUID} used for serializing
	// the ATN at the time the feature was first introduced.
	//
	// @param feature The {@link UUID} marking the first time the feature was
	// supported in the serialized ATN.
	// @param actualUuid The {@link UUID} of the actual serialized ATN which is
	// currently being deserialized.
	// @return {@code true} if the {@code actualUuid} value represents a
	// serialized ATN at or after the feature identified by {@code feature} was
	// introduced; otherwise, {@code false}.

	ATNDeserializer.prototype.isFeatureSupported = function (feature, actualUuid) {
	    var idx1 = SUPPORTED_UUIDS.indexOf(feature);
	    if (idx1 < 0) {
	        return false;
	    }
	    var idx2 = SUPPORTED_UUIDS.indexOf(actualUuid);
	    return idx2 >= idx1;
	};

	ATNDeserializer.prototype.deserialize = function (data) {
	    this.reset(data);
	    this.checkVersion();
	    this.checkUUID();
	    var atn = this.readATN();
	    this.readStates(atn);
	    this.readRules(atn);
	    this.readModes(atn);
	    var sets = [];
	    // First, deserialize sets with 16-bit arguments <= U+FFFF.
	    this.readSets(atn, sets, this.readInt.bind(this));
	    // Next, if the ATN was serialized with the Unicode SMP feature,
	    // deserialize sets with 32-bit arguments <= U+10FFFF.
	    if (this.isFeatureSupported(ADDED_UNICODE_SMP, this.uuid)) {
	        this.readSets(atn, sets, this.readInt32.bind(this));
	    }
	    this.readEdges(atn, sets);
	    this.readDecisions(atn);
	    this.readLexerActions(atn);
	    this.markPrecedenceDecisions(atn);
	    this.verifyATN(atn);
	    if (this.deserializationOptions.generateRuleBypassTransitions && atn.grammarType === ATNType.PARSER) {
	        this.generateRuleBypassTransitions(atn);
	        // re-verify after modification
	        this.verifyATN(atn);
	    }
	    return atn;
	};

	ATNDeserializer.prototype.reset = function (data) {
	    var adjust = function adjust(c) {
	        var v = c.charCodeAt(0);
	        return v > 1 ? v - 2 : v + 65533;
	    };
	    var temp = data.split("").map(adjust);
	    // don't adjust the first value since that's the version number
	    temp[0] = data.charCodeAt(0);
	    this.data = temp;
	    this.pos = 0;
	};

	ATNDeserializer.prototype.checkVersion = function () {
	    var version = this.readInt();
	    if (version !== SERIALIZED_VERSION) {
	        throw "Could not deserialize ATN with version " + version + " (expected " + SERIALIZED_VERSION + ").";
	    }
	};

	ATNDeserializer.prototype.checkUUID = function () {
	    var uuid = this.readUUID();
	    if (SUPPORTED_UUIDS.indexOf(uuid) < 0) {
	        throw "Could not deserialize ATN with UUID: " + uuid + " (expected " + SERIALIZED_UUID + " or a legacy UUID).", uuid, SERIALIZED_UUID;
	    }
	    this.uuid = uuid;
	};

	ATNDeserializer.prototype.readATN = function () {
	    var grammarType = this.readInt();
	    var maxTokenType = this.readInt();
	    return new ATN(grammarType, maxTokenType);
	};

	ATNDeserializer.prototype.readStates = function (atn) {
	    var j, pair, stateNumber;
	    var loopBackStateNumbers = [];
	    var endStateNumbers = [];
	    var nstates = this.readInt();
	    for (var i = 0; i < nstates; i++) {
	        var stype = this.readInt();
	        // ignore bad type of states
	        if (stype === ATNState.INVALID_TYPE) {
	            atn.addState(null);
	            continue;
	        }
	        var ruleIndex = this.readInt();
	        if (ruleIndex === 0xFFFF) {
	            ruleIndex = -1;
	        }
	        var s = this.stateFactory(stype, ruleIndex);
	        if (stype === ATNState.LOOP_END) {
	            // special case
	            var loopBackStateNumber = this.readInt();
	            loopBackStateNumbers.push([s, loopBackStateNumber]);
	        } else if (s instanceof BlockStartState) {
	            var endStateNumber = this.readInt();
	            endStateNumbers.push([s, endStateNumber]);
	        }
	        atn.addState(s);
	    }
	    // delay the assignment of loop back and end states until we know all the
	    // state instances have been initialized
	    for (j = 0; j < loopBackStateNumbers.length; j++) {
	        pair = loopBackStateNumbers[j];
	        pair[0].loopBackState = atn.states[pair[1]];
	    }

	    for (j = 0; j < endStateNumbers.length; j++) {
	        pair = endStateNumbers[j];
	        pair[0].endState = atn.states[pair[1]];
	    }

	    var numNonGreedyStates = this.readInt();
	    for (j = 0; j < numNonGreedyStates; j++) {
	        stateNumber = this.readInt();
	        atn.states[stateNumber].nonGreedy = true;
	    }

	    var numPrecedenceStates = this.readInt();
	    for (j = 0; j < numPrecedenceStates; j++) {
	        stateNumber = this.readInt();
	        atn.states[stateNumber].isPrecedenceRule = true;
	    }
	};

	ATNDeserializer.prototype.readRules = function (atn) {
	    var i;
	    var nrules = this.readInt();
	    if (atn.grammarType === ATNType.LEXER) {
	        atn.ruleToTokenType = initArray(nrules, 0);
	    }
	    atn.ruleToStartState = initArray(nrules, 0);
	    for (i = 0; i < nrules; i++) {
	        var s = this.readInt();
	        var startState = atn.states[s];
	        atn.ruleToStartState[i] = startState;
	        if (atn.grammarType === ATNType.LEXER) {
	            var tokenType = this.readInt();
	            if (tokenType === 0xFFFF) {
	                tokenType = Token.EOF;
	            }
	            atn.ruleToTokenType[i] = tokenType;
	        }
	    }
	    atn.ruleToStopState = initArray(nrules, 0);
	    for (i = 0; i < atn.states.length; i++) {
	        var state = atn.states[i];
	        if (!(state instanceof RuleStopState)) {
	            continue;
	        }
	        atn.ruleToStopState[state.ruleIndex] = state;
	        atn.ruleToStartState[state.ruleIndex].stopState = state;
	    }
	};

	ATNDeserializer.prototype.readModes = function (atn) {
	    var nmodes = this.readInt();
	    for (var i = 0; i < nmodes; i++) {
	        var s = this.readInt();
	        atn.modeToStartState.push(atn.states[s]);
	    }
	};

	ATNDeserializer.prototype.readSets = function (atn, sets, readUnicode) {
	    var m = this.readInt();
	    for (var i = 0; i < m; i++) {
	        var iset = new IntervalSet();
	        sets.push(iset);
	        var n = this.readInt();
	        var containsEof = this.readInt();
	        if (containsEof !== 0) {
	            iset.addOne(-1);
	        }
	        for (var j = 0; j < n; j++) {
	            var i1 = readUnicode();
	            var i2 = readUnicode();
	            iset.addRange(i1, i2);
	        }
	    }
	};

	ATNDeserializer.prototype.readEdges = function (atn, sets) {
	    var i, j, state, trans, target;
	    var nedges = this.readInt();
	    for (i = 0; i < nedges; i++) {
	        var src = this.readInt();
	        var trg = this.readInt();
	        var ttype = this.readInt();
	        var arg1 = this.readInt();
	        var arg2 = this.readInt();
	        var arg3 = this.readInt();
	        trans = this.edgeFactory(atn, ttype, src, trg, arg1, arg2, arg3, sets);
	        var srcState = atn.states[src];
	        srcState.addTransition(trans);
	    }
	    // edges for rule stop states can be derived, so they aren't serialized
	    for (i = 0; i < atn.states.length; i++) {
	        state = atn.states[i];
	        for (j = 0; j < state.transitions.length; j++) {
	            var t = state.transitions[j];
	            if (!(t instanceof RuleTransition)) {
	                continue;
	            }
	            var outermostPrecedenceReturn = -1;
	            if (atn.ruleToStartState[t.target.ruleIndex].isPrecedenceRule) {
	                if (t.precedence === 0) {
	                    outermostPrecedenceReturn = t.target.ruleIndex;
	                }
	            }

	            trans = new EpsilonTransition(t.followState, outermostPrecedenceReturn);
	            atn.ruleToStopState[t.target.ruleIndex].addTransition(trans);
	        }
	    }

	    for (i = 0; i < atn.states.length; i++) {
	        state = atn.states[i];
	        if (state instanceof BlockStartState) {
	            // we need to know the end state to set its start state
	            if (state.endState === null) {
	                throw "IllegalState";
	            }
	            // block end states can only be associated to a single block start
	            // state
	            if (state.endState.startState !== null) {
	                throw "IllegalState";
	            }
	            state.endState.startState = state;
	        }
	        if (state instanceof PlusLoopbackState) {
	            for (j = 0; j < state.transitions.length; j++) {
	                target = state.transitions[j].target;
	                if (target instanceof PlusBlockStartState) {
	                    target.loopBackState = state;
	                }
	            }
	        } else if (state instanceof StarLoopbackState) {
	            for (j = 0; j < state.transitions.length; j++) {
	                target = state.transitions[j].target;
	                if (target instanceof StarLoopEntryState) {
	                    target.loopBackState = state;
	                }
	            }
	        }
	    }
	};

	ATNDeserializer.prototype.readDecisions = function (atn) {
	    var ndecisions = this.readInt();
	    for (var i = 0; i < ndecisions; i++) {
	        var s = this.readInt();
	        var decState = atn.states[s];
	        atn.decisionToState.push(decState);
	        decState.decision = i;
	    }
	};

	ATNDeserializer.prototype.readLexerActions = function (atn) {
	    if (atn.grammarType === ATNType.LEXER) {
	        var count = this.readInt();
	        atn.lexerActions = initArray(count, null);
	        for (var i = 0; i < count; i++) {
	            var actionType = this.readInt();
	            var data1 = this.readInt();
	            if (data1 === 0xFFFF) {
	                data1 = -1;
	            }
	            var data2 = this.readInt();
	            if (data2 === 0xFFFF) {
	                data2 = -1;
	            }
	            var lexerAction = this.lexerActionFactory(actionType, data1, data2);
	            atn.lexerActions[i] = lexerAction;
	        }
	    }
	};

	ATNDeserializer.prototype.generateRuleBypassTransitions = function (atn) {
	    var i;
	    var count = atn.ruleToStartState.length;
	    for (i = 0; i < count; i++) {
	        atn.ruleToTokenType[i] = atn.maxTokenType + i + 1;
	    }
	    for (i = 0; i < count; i++) {
	        this.generateRuleBypassTransition(atn, i);
	    }
	};

	ATNDeserializer.prototype.generateRuleBypassTransition = function (atn, idx) {
	    var i, state;
	    var bypassStart = new BasicBlockStartState();
	    bypassStart.ruleIndex = idx;
	    atn.addState(bypassStart);

	    var bypassStop = new BlockEndState();
	    bypassStop.ruleIndex = idx;
	    atn.addState(bypassStop);

	    bypassStart.endState = bypassStop;
	    atn.defineDecisionState(bypassStart);

	    bypassStop.startState = bypassStart;

	    var excludeTransition = null;
	    var endState = null;

	    if (atn.ruleToStartState[idx].isPrecedenceRule) {
	        // wrap from the beginning of the rule to the StarLoopEntryState
	        endState = null;
	        for (i = 0; i < atn.states.length; i++) {
	            state = atn.states[i];
	            if (this.stateIsEndStateFor(state, idx)) {
	                endState = state;
	                excludeTransition = state.loopBackState.transitions[0];
	                break;
	            }
	        }
	        if (excludeTransition === null) {
	            throw "Couldn't identify final state of the precedence rule prefix section.";
	        }
	    } else {
	        endState = atn.ruleToStopState[idx];
	    }

	    // all non-excluded transitions that currently target end state need to
	    // target blockEnd instead
	    for (i = 0; i < atn.states.length; i++) {
	        state = atn.states[i];
	        for (var j = 0; j < state.transitions.length; j++) {
	            var transition = state.transitions[j];
	            if (transition === excludeTransition) {
	                continue;
	            }
	            if (transition.target === endState) {
	                transition.target = bypassStop;
	            }
	        }
	    }

	    // all transitions leaving the rule start state need to leave blockStart
	    // instead
	    var ruleToStartState = atn.ruleToStartState[idx];
	    var count = ruleToStartState.transitions.length;
	    while (count > 0) {
	        bypassStart.addTransition(ruleToStartState.transitions[count - 1]);
	        ruleToStartState.transitions = ruleToStartState.transitions.slice(-1);
	    }
	    // link the new states
	    atn.ruleToStartState[idx].addTransition(new EpsilonTransition(bypassStart));
	    bypassStop.addTransition(new EpsilonTransition(endState));

	    var matchState = new BasicState();
	    atn.addState(matchState);
	    matchState.addTransition(new AtomTransition(bypassStop, atn.ruleToTokenType[idx]));
	    bypassStart.addTransition(new EpsilonTransition(matchState));
	};

	ATNDeserializer.prototype.stateIsEndStateFor = function (state, idx) {
	    if (state.ruleIndex !== idx) {
	        return null;
	    }
	    if (!(state instanceof StarLoopEntryState)) {
	        return null;
	    }
	    var maybeLoopEndState = state.transitions[state.transitions.length - 1].target;
	    if (!(maybeLoopEndState instanceof LoopEndState)) {
	        return null;
	    }
	    if (maybeLoopEndState.epsilonOnlyTransitions && maybeLoopEndState.transitions[0].target instanceof RuleStopState) {
	        return state;
	    } else {
	        return null;
	    }
	};

	//
	// Analyze the {@link StarLoopEntryState} states in the specified ATN to set
	// the {@link StarLoopEntryState//isPrecedenceDecision} field to the
	// correct value.
	//
	// @param atn The ATN.
	//
	ATNDeserializer.prototype.markPrecedenceDecisions = function (atn) {
	    for (var i = 0; i < atn.states.length; i++) {
	        var state = atn.states[i];
	        if (!(state instanceof StarLoopEntryState)) {
	            continue;
	        }
	        // We analyze the ATN to determine if this ATN decision state is the
	        // decision for the closure block that determines whether a
	        // precedence rule should continue or complete.
	        //
	        if (atn.ruleToStartState[state.ruleIndex].isPrecedenceRule) {
	            var maybeLoopEndState = state.transitions[state.transitions.length - 1].target;
	            if (maybeLoopEndState instanceof LoopEndState) {
	                if (maybeLoopEndState.epsilonOnlyTransitions && maybeLoopEndState.transitions[0].target instanceof RuleStopState) {
	                    state.isPrecedenceDecision = true;
	                }
	            }
	        }
	    }
	};

	ATNDeserializer.prototype.verifyATN = function (atn) {
	    if (!this.deserializationOptions.verifyATN) {
	        return;
	    }
	    // verify assumptions
	    for (var i = 0; i < atn.states.length; i++) {
	        var state = atn.states[i];
	        if (state === null) {
	            continue;
	        }
	        this.checkCondition(state.epsilonOnlyTransitions || state.transitions.length <= 1);
	        if (state instanceof PlusBlockStartState) {
	            this.checkCondition(state.loopBackState !== null);
	        } else if (state instanceof StarLoopEntryState) {
	            this.checkCondition(state.loopBackState !== null);
	            this.checkCondition(state.transitions.length === 2);
	            if (state.transitions[0].target instanceof StarBlockStartState) {
	                this.checkCondition(state.transitions[1].target instanceof LoopEndState);
	                this.checkCondition(!state.nonGreedy);
	            } else if (state.transitions[0].target instanceof LoopEndState) {
	                this.checkCondition(state.transitions[1].target instanceof StarBlockStartState);
	                this.checkCondition(state.nonGreedy);
	            } else {
	                throw "IllegalState";
	            }
	        } else if (state instanceof StarLoopbackState) {
	            this.checkCondition(state.transitions.length === 1);
	            this.checkCondition(state.transitions[0].target instanceof StarLoopEntryState);
	        } else if (state instanceof LoopEndState) {
	            this.checkCondition(state.loopBackState !== null);
	        } else if (state instanceof RuleStartState) {
	            this.checkCondition(state.stopState !== null);
	        } else if (state instanceof BlockStartState) {
	            this.checkCondition(state.endState !== null);
	        } else if (state instanceof BlockEndState) {
	            this.checkCondition(state.startState !== null);
	        } else if (state instanceof DecisionState) {
	            this.checkCondition(state.transitions.length <= 1 || state.decision >= 0);
	        } else {
	            this.checkCondition(state.transitions.length <= 1 || state instanceof RuleStopState);
	        }
	    }
	};

	ATNDeserializer.prototype.checkCondition = function (condition, message) {
	    if (!condition) {
	        if (message === undefined || message === null) {
	            message = "IllegalState";
	        }
	        throw message;
	    }
	};

	ATNDeserializer.prototype.readInt = function () {
	    return this.data[this.pos++];
	};

	ATNDeserializer.prototype.readInt32 = function () {
	    var low = this.readInt();
	    var high = this.readInt();
	    return low | high << 16;
	};

	ATNDeserializer.prototype.readLong = function () {
	    var low = this.readInt32();
	    var high = this.readInt32();
	    return low & 0x00000000FFFFFFFF | high << 32;
	};

	function createByteToHex() {
	    var bth = [];
	    for (var i = 0; i < 256; i++) {
	        bth[i] = (i + 0x100).toString(16).substr(1).toUpperCase();
	    }
	    return bth;
	}

	var byteToHex = createByteToHex();

	ATNDeserializer.prototype.readUUID = function () {
	    var bb = [];
	    for (var i = 7; i >= 0; i--) {
	        var int = this.readInt();
	        /* jshint bitwise: false */
	        bb[2 * i + 1] = int & 0xFF;
	        bb[2 * i] = int >> 8 & 0xFF;
	    }
	    return byteToHex[bb[0]] + byteToHex[bb[1]] + byteToHex[bb[2]] + byteToHex[bb[3]] + '-' + byteToHex[bb[4]] + byteToHex[bb[5]] + '-' + byteToHex[bb[6]] + byteToHex[bb[7]] + '-' + byteToHex[bb[8]] + byteToHex[bb[9]] + '-' + byteToHex[bb[10]] + byteToHex[bb[11]] + byteToHex[bb[12]] + byteToHex[bb[13]] + byteToHex[bb[14]] + byteToHex[bb[15]];
	};

	ATNDeserializer.prototype.edgeFactory = function (atn, type, src, trg, arg1, arg2, arg3, sets) {
	    var target = atn.states[trg];
	    switch (type) {
	        case Transition.EPSILON:
	            return new EpsilonTransition(target);
	        case Transition.RANGE:
	            return arg3 !== 0 ? new RangeTransition(target, Token.EOF, arg2) : new RangeTransition(target, arg1, arg2);
	        case Transition.RULE:
	            return new RuleTransition(atn.states[arg1], arg2, arg3, target);
	        case Transition.PREDICATE:
	            return new PredicateTransition(target, arg1, arg2, arg3 !== 0);
	        case Transition.PRECEDENCE:
	            return new PrecedencePredicateTransition(target, arg1);
	        case Transition.ATOM:
	            return arg3 !== 0 ? new AtomTransition(target, Token.EOF) : new AtomTransition(target, arg1);
	        case Transition.ACTION:
	            return new ActionTransition(target, arg1, arg2, arg3 !== 0);
	        case Transition.SET:
	            return new SetTransition(target, sets[arg1]);
	        case Transition.NOT_SET:
	            return new NotSetTransition(target, sets[arg1]);
	        case Transition.WILDCARD:
	            return new WildcardTransition(target);
	        default:
	            throw "The specified transition type: " + type + " is not valid.";
	    }
	};

	ATNDeserializer.prototype.stateFactory = function (type, ruleIndex) {
	    if (this.stateFactories === null) {
	        var sf = [];
	        sf[ATNState.INVALID_TYPE] = null;
	        sf[ATNState.BASIC] = function () {
	            return new BasicState();
	        };
	        sf[ATNState.RULE_START] = function () {
	            return new RuleStartState();
	        };
	        sf[ATNState.BLOCK_START] = function () {
	            return new BasicBlockStartState();
	        };
	        sf[ATNState.PLUS_BLOCK_START] = function () {
	            return new PlusBlockStartState();
	        };
	        sf[ATNState.STAR_BLOCK_START] = function () {
	            return new StarBlockStartState();
	        };
	        sf[ATNState.TOKEN_START] = function () {
	            return new TokensStartState();
	        };
	        sf[ATNState.RULE_STOP] = function () {
	            return new RuleStopState();
	        };
	        sf[ATNState.BLOCK_END] = function () {
	            return new BlockEndState();
	        };
	        sf[ATNState.STAR_LOOP_BACK] = function () {
	            return new StarLoopbackState();
	        };
	        sf[ATNState.STAR_LOOP_ENTRY] = function () {
	            return new StarLoopEntryState();
	        };
	        sf[ATNState.PLUS_LOOP_BACK] = function () {
	            return new PlusLoopbackState();
	        };
	        sf[ATNState.LOOP_END] = function () {
	            return new LoopEndState();
	        };
	        this.stateFactories = sf;
	    }
	    if (type > this.stateFactories.length || this.stateFactories[type] === null) {
	        throw "The specified state type " + type + " is not valid.";
	    } else {
	        var s = this.stateFactories[type]();
	        if (s !== null) {
	            s.ruleIndex = ruleIndex;
	            return s;
	        }
	    }
	};

	ATNDeserializer.prototype.lexerActionFactory = function (type, data1, data2) {
	    if (this.actionFactories === null) {
	        var af = [];
	        af[LexerActionType.CHANNEL] = function (data1, data2) {
	            return new LexerChannelAction(data1);
	        };
	        af[LexerActionType.CUSTOM] = function (data1, data2) {
	            return new LexerCustomAction(data1, data2);
	        };
	        af[LexerActionType.MODE] = function (data1, data2) {
	            return new LexerModeAction(data1);
	        };
	        af[LexerActionType.MORE] = function (data1, data2) {
	            return LexerMoreAction.INSTANCE;
	        };
	        af[LexerActionType.POP_MODE] = function (data1, data2) {
	            return LexerPopModeAction.INSTANCE;
	        };
	        af[LexerActionType.PUSH_MODE] = function (data1, data2) {
	            return new LexerPushModeAction(data1);
	        };
	        af[LexerActionType.SKIP] = function (data1, data2) {
	            return LexerSkipAction.INSTANCE;
	        };
	        af[LexerActionType.TYPE] = function (data1, data2) {
	            return new LexerTypeAction(data1);
	        };
	        this.actionFactories = af;
	    }
	    if (type > this.actionFactories.length || this.actionFactories[type] === null) {
	        throw "The specified lexer action type " + type + " is not valid.";
	    } else {
	        return this.actionFactories[type](data1, data2);
	    }
	};

	exports.ATNDeserializer = ATNDeserializer;

/***/ },
/* 18 */
/***/ function(module, exports) {

	"use strict";

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	// Represents the type of recognizer an ATN applies to.

	function ATNType() {}

	ATNType.LEXER = 0;
	ATNType.PARSER = 1;

	exports.ATNType = ATNType;

/***/ },
/* 19 */
/***/ function(module, exports) {

	"use strict";

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	function ATNDeserializationOptions(copyFrom) {
	  if (copyFrom === undefined) {
	    copyFrom = null;
	  }
	  this.readOnly = false;
	  this.verifyATN = copyFrom === null ? true : copyFrom.verifyATN;
	  this.generateRuleBypassTransitions = copyFrom === null ? false : copyFrom.generateRuleBypassTransitions;

	  return this;
	}

	ATNDeserializationOptions.defaultOptions = new ATNDeserializationOptions();
	ATNDeserializationOptions.defaultOptions.readOnly = true;

	//    def __setattr__(self, key, value):
	//        if key!="readOnly" and self.readOnly:
	//            raise Exception("The object is read only.")
	//        super(type(self), self).__setattr__(key,value)

	exports.ATNDeserializationOptions = ATNDeserializationOptions;

/***/ },
/* 20 */
/***/ function(module, exports) {

	"use strict";

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	function LexerActionType() {}

	LexerActionType.CHANNEL = 0; //The type of a {@link LexerChannelAction} action.
	LexerActionType.CUSTOM = 1; //The type of a {@link LexerCustomAction} action.
	LexerActionType.MODE = 2; //The type of a {@link LexerModeAction} action.
	LexerActionType.MORE = 3; //The type of a {@link LexerMoreAction} action.
	LexerActionType.POP_MODE = 4; //The type of a {@link LexerPopModeAction} action.
	LexerActionType.PUSH_MODE = 5; //The type of a {@link LexerPushModeAction} action.
	LexerActionType.SKIP = 6; //The type of a {@link LexerSkipAction} action.
	LexerActionType.TYPE = 7; //The type of a {@link LexerTypeAction} action.

	function LexerAction(action) {
	    this.actionType = action;
	    this.isPositionDependent = false;
	    return this;
	}

	LexerAction.prototype.hashCode = function () {
	    var hash = new Hash();
	    this.updateHashCode(hash);
	    return hash.finish();
	};

	LexerAction.prototype.updateHashCode = function (hash) {
	    hash.update(this.actionType);
	};

	LexerAction.prototype.equals = function (other) {
	    return this === other;
	};

	//
	// Implements the {@code skip} lexer action by calling {@link Lexer//skip}.
	//
	// <p>The {@code skip} command does not have any parameters, so this action is
	// implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
	function LexerSkipAction() {
	    LexerAction.call(this, LexerActionType.SKIP);
	    return this;
	}

	LexerSkipAction.prototype = Object.create(LexerAction.prototype);
	LexerSkipAction.prototype.constructor = LexerSkipAction;

	// Provides a singleton instance of this parameterless lexer action.
	LexerSkipAction.INSTANCE = new LexerSkipAction();

	LexerSkipAction.prototype.execute = function (lexer) {
	    lexer.skip();
	};

	LexerSkipAction.prototype.toString = function () {
	    return "skip";
	};

	//  Implements the {@code type} lexer action by calling {@link Lexer//setType}
	// with the assigned type.
	function LexerTypeAction(type) {
	    LexerAction.call(this, LexerActionType.TYPE);
	    this.type = type;
	    return this;
	}

	LexerTypeAction.prototype = Object.create(LexerAction.prototype);
	LexerTypeAction.prototype.constructor = LexerTypeAction;

	LexerTypeAction.prototype.execute = function (lexer) {
	    lexer.type = this.type;
	};

	LexerTypeAction.prototype.updateHashCode = function (hash) {
	    hash.update(this.actionType, this.type);
	};

	LexerTypeAction.prototype.equals = function (other) {
	    if (this === other) {
	        return true;
	    } else if (!(other instanceof LexerTypeAction)) {
	        return false;
	    } else {
	        return this.type === other.type;
	    }
	};

	LexerTypeAction.prototype.toString = function () {
	    return "type(" + this.type + ")";
	};

	// Implements the {@code pushMode} lexer action by calling
	// {@link Lexer//pushMode} with the assigned mode.
	function LexerPushModeAction(mode) {
	    LexerAction.call(this, LexerActionType.PUSH_MODE);
	    this.mode = mode;
	    return this;
	}

	LexerPushModeAction.prototype = Object.create(LexerAction.prototype);
	LexerPushModeAction.prototype.constructor = LexerPushModeAction;

	// <p>This action is implemented by calling {@link Lexer//pushMode} with the
	// value provided by {@link //getMode}.</p>
	LexerPushModeAction.prototype.execute = function (lexer) {
	    lexer.pushMode(this.mode);
	};

	LexerPushModeAction.prototype.updateHashCode = function (hash) {
	    hash.update(this.actionType, this.mode);
	};

	LexerPushModeAction.prototype.equals = function (other) {
	    if (this === other) {
	        return true;
	    } else if (!(other instanceof LexerPushModeAction)) {
	        return false;
	    } else {
	        return this.mode === other.mode;
	    }
	};

	LexerPushModeAction.prototype.toString = function () {
	    return "pushMode(" + this.mode + ")";
	};

	// Implements the {@code popMode} lexer action by calling {@link Lexer//popMode}.
	//
	// <p>The {@code popMode} command does not have any parameters, so this action is
	// implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
	function LexerPopModeAction() {
	    LexerAction.call(this, LexerActionType.POP_MODE);
	    return this;
	}

	LexerPopModeAction.prototype = Object.create(LexerAction.prototype);
	LexerPopModeAction.prototype.constructor = LexerPopModeAction;

	LexerPopModeAction.INSTANCE = new LexerPopModeAction();

	// <p>This action is implemented by calling {@link Lexer//popMode}.</p>
	LexerPopModeAction.prototype.execute = function (lexer) {
	    lexer.popMode();
	};

	LexerPopModeAction.prototype.toString = function () {
	    return "popMode";
	};

	// Implements the {@code more} lexer action by calling {@link Lexer//more}.
	//
	// <p>The {@code more} command does not have any parameters, so this action is
	// implemented as a singleton instance exposed by {@link //INSTANCE}.</p>
	function LexerMoreAction() {
	    LexerAction.call(this, LexerActionType.MORE);
	    return this;
	}

	LexerMoreAction.prototype = Object.create(LexerAction.prototype);
	LexerMoreAction.prototype.constructor = LexerMoreAction;

	LexerMoreAction.INSTANCE = new LexerMoreAction();

	// <p>This action is implemented by calling {@link Lexer//popMode}.</p>
	LexerMoreAction.prototype.execute = function (lexer) {
	    lexer.more();
	};

	LexerMoreAction.prototype.toString = function () {
	    return "more";
	};

	// Implements the {@code mode} lexer action by calling {@link Lexer//mode} with
	// the assigned mode.
	function LexerModeAction(mode) {
	    LexerAction.call(this, LexerActionType.MODE);
	    this.mode = mode;
	    return this;
	}

	LexerModeAction.prototype = Object.create(LexerAction.prototype);
	LexerModeAction.prototype.constructor = LexerModeAction;

	// <p>This action is implemented by calling {@link Lexer//mode} with the
	// value provided by {@link //getMode}.</p>
	LexerModeAction.prototype.execute = function (lexer) {
	    lexer.mode(this.mode);
	};

	LexerModeAction.prototype.updateHashCode = function (hash) {
	    hash.update(this.actionType, this.mode);
	};

	LexerModeAction.prototype.equals = function (other) {
	    if (this === other) {
	        return true;
	    } else if (!(other instanceof LexerModeAction)) {
	        return false;
	    } else {
	        return this.mode === other.mode;
	    }
	};

	LexerModeAction.prototype.toString = function () {
	    return "mode(" + this.mode + ")";
	};

	// Executes a custom lexer action by calling {@link Recognizer//action} with the
	// rule and action indexes assigned to the custom action. The implementation of
	// a custom action is added to the generated code for the lexer in an override
	// of {@link Recognizer//action} when the grammar is compiled.
	//
	// <p>This class may represent embedded actions created with the <code>{...}</code>
	// syntax in ANTLR 4, as well as actions created for lexer commands where the
	// command argument could not be evaluated when the grammar was compiled.</p>


	// Constructs a custom lexer action with the specified rule and action
	// indexes.
	//
	// @param ruleIndex The rule index to use for calls to
	// {@link Recognizer//action}.
	// @param actionIndex The action index to use for calls to
	// {@link Recognizer//action}.

	function LexerCustomAction(ruleIndex, actionIndex) {
	    LexerAction.call(this, LexerActionType.CUSTOM);
	    this.ruleIndex = ruleIndex;
	    this.actionIndex = actionIndex;
	    this.isPositionDependent = true;
	    return this;
	}

	LexerCustomAction.prototype = Object.create(LexerAction.prototype);
	LexerCustomAction.prototype.constructor = LexerCustomAction;

	// <p>Custom actions are implemented by calling {@link Lexer//action} with the
	// appropriate rule and action indexes.</p>
	LexerCustomAction.prototype.execute = function (lexer) {
	    lexer.action(null, this.ruleIndex, this.actionIndex);
	};

	LexerCustomAction.prototype.updateHashCode = function (hash) {
	    hash.update(this.actionType, this.ruleIndex, this.actionIndex);
	};

	LexerCustomAction.prototype.equals = function (other) {
	    if (this === other) {
	        return true;
	    } else if (!(other instanceof LexerCustomAction)) {
	        return false;
	    } else {
	        return this.ruleIndex === other.ruleIndex && this.actionIndex === other.actionIndex;
	    }
	};

	// Implements the {@code channel} lexer action by calling
	// {@link Lexer//setChannel} with the assigned channel.
	// Constructs a new {@code channel} action with the specified channel value.
	// @param channel The channel value to pass to {@link Lexer//setChannel}.
	function LexerChannelAction(channel) {
	    LexerAction.call(this, LexerActionType.CHANNEL);
	    this.channel = channel;
	    return this;
	}

	LexerChannelAction.prototype = Object.create(LexerAction.prototype);
	LexerChannelAction.prototype.constructor = LexerChannelAction;

	// <p>This action is implemented by calling {@link Lexer//setChannel} with the
	// value provided by {@link //getChannel}.</p>
	LexerChannelAction.prototype.execute = function (lexer) {
	    lexer._channel = this.channel;
	};

	LexerChannelAction.prototype.updateHashCode = function (hash) {
	    hash.update(this.actionType, this.channel);
	};

	LexerChannelAction.prototype.equals = function (other) {
	    if (this === other) {
	        return true;
	    } else if (!(other instanceof LexerChannelAction)) {
	        return false;
	    } else {
	        return this.channel === other.channel;
	    }
	};

	LexerChannelAction.prototype.toString = function () {
	    return "channel(" + this.channel + ")";
	};

	// This implementation of {@link LexerAction} is used for tracking input offsets
	// for position-dependent actions within a {@link LexerActionExecutor}.
	//
	// <p>This action is not serialized as part of the ATN, and is only required for
	// position-dependent lexer actions which appear at a location other than the
	// end of a rule. For more information about DFA optimizations employed for
	// lexer actions, see {@link LexerActionExecutor//append} and
	// {@link LexerActionExecutor//fixOffsetBeforeMatch}.</p>

	// Constructs a new indexed custom action by associating a character offset
	// with a {@link LexerAction}.
	//
	// <p>Note: This class is only required for lexer actions for which
	// {@link LexerAction//isPositionDependent} returns {@code true}.</p>
	//
	// @param offset The offset into the input {@link CharStream}, relative to
	// the token start index, at which the specified lexer action should be
	// executed.
	// @param action The lexer action to execute at a particular offset in the
	// input {@link CharStream}.
	function LexerIndexedCustomAction(offset, action) {
	    LexerAction.call(this, action.actionType);
	    this.offset = offset;
	    this.action = action;
	    this.isPositionDependent = true;
	    return this;
	}

	LexerIndexedCustomAction.prototype = Object.create(LexerAction.prototype);
	LexerIndexedCustomAction.prototype.constructor = LexerIndexedCustomAction;

	// <p>This method calls {@link //execute} on the result of {@link //getAction}
	// using the provided {@code lexer}.</p>
	LexerIndexedCustomAction.prototype.execute = function (lexer) {
	    // assume the input stream position was properly set by the calling code
	    this.action.execute(lexer);
	};

	LexerIndexedCustomAction.prototype.updateHashCode = function (hash) {
	    hash.update(this.actionType, this.offset, this.action);
	};

	LexerIndexedCustomAction.prototype.equals = function (other) {
	    if (this === other) {
	        return true;
	    } else if (!(other instanceof LexerIndexedCustomAction)) {
	        return false;
	    } else {
	        return this.offset === other.offset && this.action === other.action;
	    }
	};

	exports.LexerActionType = LexerActionType;
	exports.LexerSkipAction = LexerSkipAction;
	exports.LexerChannelAction = LexerChannelAction;
	exports.LexerCustomAction = LexerCustomAction;
	exports.LexerIndexedCustomAction = LexerIndexedCustomAction;
	exports.LexerMoreAction = LexerMoreAction;
	exports.LexerTypeAction = LexerTypeAction;
	exports.LexerPushModeAction = LexerPushModeAction;
	exports.LexerPopModeAction = LexerPopModeAction;
	exports.LexerModeAction = LexerModeAction;

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	// When we hit an accept state in either the DFA or the ATN, we
	//  have to notify the character stream to start buffering characters
	//  via {@link IntStream//mark} and record the current state. The current sim state
	//  includes the current index into the input, the current line,
	//  and current character position in that line. Note that the Lexer is
	//  tracking the starting line and characterization of the token. These
	//  variables track the "state" of the simulator when it hits an accept state.
	//
	//  <p>We track these variables separately for the DFA and ATN simulation
	//  because the DFA simulation often has to fail over to the ATN
	//  simulation. If the ATN simulation fails, we need the DFA to fall
	//  back to its previously accepted state, if any. If the ATN succeeds,
	//  then the ATN does the accept and the DFA simulator that invoked it
	//  can simply return the predicted token type.</p>
	///

	var Token = __webpack_require__(6).Token;
	var Lexer = __webpack_require__(22).Lexer;
	var ATN = __webpack_require__(3).ATN;
	var ATNSimulator = __webpack_require__(27).ATNSimulator;
	var DFAState = __webpack_require__(28).DFAState;
	var ATNConfigSet = __webpack_require__(29).ATNConfigSet;
	var OrderedATNConfigSet = __webpack_require__(29).OrderedATNConfigSet;
	var PredictionContext = __webpack_require__(12).PredictionContext;
	var SingletonPredictionContext = __webpack_require__(12).SingletonPredictionContext;
	var RuleStopState = __webpack_require__(8).RuleStopState;
	var LexerATNConfig = __webpack_require__(7).LexerATNConfig;
	var Transition = __webpack_require__(11).Transition;
	var LexerActionExecutor = __webpack_require__(30).LexerActionExecutor;
	var LexerNoViableAltException = __webpack_require__(26).LexerNoViableAltException;

	function resetSimState(sim) {
		sim.index = -1;
		sim.line = 0;
		sim.column = -1;
		sim.dfaState = null;
	}

	function SimState() {
		resetSimState(this);
		return this;
	}

	SimState.prototype.reset = function () {
		resetSimState(this);
	};

	function LexerATNSimulator(recog, atn, decisionToDFA, sharedContextCache) {
		ATNSimulator.call(this, atn, sharedContextCache);
		this.decisionToDFA = decisionToDFA;
		this.recog = recog;
		// The current token's starting index into the character stream.
		// Shared across DFA to ATN simulation in case the ATN fails and the
		// DFA did not have a previous accept state. In this case, we use the
		// ATN-generated exception object.
		this.startIndex = -1;
		// line number 1..n within the input///
		this.line = 1;
		// The index of the character relative to the beginning of the line
		// 0..n-1///
		this.column = 0;
		this.mode = Lexer.DEFAULT_MODE;
		// Used during DFA/ATN exec to record the most recent accept configuration
		// info
		this.prevAccept = new SimState();
		// done
		return this;
	}

	LexerATNSimulator.prototype = Object.create(ATNSimulator.prototype);
	LexerATNSimulator.prototype.constructor = LexerATNSimulator;

	LexerATNSimulator.debug = false;
	LexerATNSimulator.dfa_debug = false;

	LexerATNSimulator.MIN_DFA_EDGE = 0;
	LexerATNSimulator.MAX_DFA_EDGE = 127; // forces unicode to stay in ATN

	LexerATNSimulator.match_calls = 0;

	LexerATNSimulator.prototype.copyState = function (simulator) {
		this.column = simulator.column;
		this.line = simulator.line;
		this.mode = simulator.mode;
		this.startIndex = simulator.startIndex;
	};

	LexerATNSimulator.prototype.match = function (input, mode) {
		this.match_calls += 1;
		this.mode = mode;
		var mark = input.mark();
		try {
			this.startIndex = input.index;
			this.prevAccept.reset();
			var dfa = this.decisionToDFA[mode];
			if (dfa.s0 === null) {
				return this.matchATN(input);
			} else {
				return this.execATN(input, dfa.s0);
			}
		} finally {
			input.release(mark);
		}
	};

	LexerATNSimulator.prototype.reset = function () {
		this.prevAccept.reset();
		this.startIndex = -1;
		this.line = 1;
		this.column = 0;
		this.mode = Lexer.DEFAULT_MODE;
	};

	LexerATNSimulator.prototype.matchATN = function (input) {
		var startState = this.atn.modeToStartState[this.mode];

		if (LexerATNSimulator.debug) {
			console.log("matchATN mode " + this.mode + " start: " + startState);
		}
		var old_mode = this.mode;
		var s0_closure = this.computeStartState(input, startState);
		var suppressEdge = s0_closure.hasSemanticContext;
		s0_closure.hasSemanticContext = false;

		var next = this.addDFAState(s0_closure);
		if (!suppressEdge) {
			this.decisionToDFA[this.mode].s0 = next;
		}

		var predict = this.execATN(input, next);

		if (LexerATNSimulator.debug) {
			console.log("DFA after matchATN: " + this.decisionToDFA[old_mode].toLexerString());
		}
		return predict;
	};

	LexerATNSimulator.prototype.execATN = function (input, ds0) {
		if (LexerATNSimulator.debug) {
			console.log("start state closure=" + ds0.configs);
		}
		if (ds0.isAcceptState) {
			// allow zero-length tokens
			this.captureSimState(this.prevAccept, input, ds0);
		}
		var t = input.LA(1);
		var s = ds0; // s is current/from DFA state

		while (true) {
			// while more work
			if (LexerATNSimulator.debug) {
				console.log("execATN loop starting closure: " + s.configs);
			}

			// As we move src->trg, src->trg, we keep track of the previous trg to
			// avoid looking up the DFA state again, which is expensive.
			// If the previous target was already part of the DFA, we might
			// be able to avoid doing a reach operation upon t. If s!=null,
			// it means that semantic predicates didn't prevent us from
			// creating a DFA state. Once we know s!=null, we check to see if
			// the DFA state has an edge already for t. If so, we can just reuse
			// it's configuration set; there's no point in re-computing it.
			// This is kind of like doing DFA simulation within the ATN
			// simulation because DFA simulation is really just a way to avoid
			// computing reach/closure sets. Technically, once we know that
			// we have a previously added DFA state, we could jump over to
			// the DFA simulator. But, that would mean popping back and forth
			// a lot and making things more complicated algorithmically.
			// This optimization makes a lot of sense for loops within DFA.
			// A character will take us back to an existing DFA state
			// that already has lots of edges out of it. e.g., .* in comments.
			// print("Target for:" + str(s) + " and:" + str(t))
			var target = this.getExistingTargetState(s, t);
			// print("Existing:" + str(target))
			if (target === null) {
				target = this.computeTargetState(input, s, t);
				// print("Computed:" + str(target))
			}
			if (target === ATNSimulator.ERROR) {
				break;
			}
			// If this is a consumable input element, make sure to consume before
			// capturing the accept state so the input index, line, and char
			// position accurately reflect the state of the interpreter at the
			// end of the token.
			if (t !== Token.EOF) {
				this.consume(input);
			}
			if (target.isAcceptState) {
				this.captureSimState(this.prevAccept, input, target);
				if (t === Token.EOF) {
					break;
				}
			}
			t = input.LA(1);
			s = target; // flip; current DFA target becomes new src/from state
		}
		return this.failOrAccept(this.prevAccept, input, s.configs, t);
	};

	// Get an existing target state for an edge in the DFA. If the target state
	// for the edge has not yet been computed or is otherwise not available,
	// this method returns {@code null}.
	//
	// @param s The current DFA state
	// @param t The next input symbol
	// @return The existing target DFA state for the given input symbol
	// {@code t}, or {@code null} if the target state for this edge is not
	// already cached
	LexerATNSimulator.prototype.getExistingTargetState = function (s, t) {
		if (s.edges === null || t < LexerATNSimulator.MIN_DFA_EDGE || t > LexerATNSimulator.MAX_DFA_EDGE) {
			return null;
		}

		var target = s.edges[t - LexerATNSimulator.MIN_DFA_EDGE];
		if (target === undefined) {
			target = null;
		}
		if (LexerATNSimulator.debug && target !== null) {
			console.log("reuse state " + s.stateNumber + " edge to " + target.stateNumber);
		}
		return target;
	};

	// Compute a target state for an edge in the DFA, and attempt to add the
	// computed state and corresponding edge to the DFA.
	//
	// @param input The input stream
	// @param s The current DFA state
	// @param t The next input symbol
	//
	// @return The computed target DFA state for the given input symbol
	// {@code t}. If {@code t} does not lead to a valid DFA state, this method
	// returns {@link //ERROR}.
	LexerATNSimulator.prototype.computeTargetState = function (input, s, t) {
		var reach = new OrderedATNConfigSet();
		// if we don't find an existing DFA state
		// Fill reach starting from closure, following t transitions
		this.getReachableConfigSet(input, s.configs, reach, t);

		if (reach.items.length === 0) {
			// we got nowhere on t from s
			if (!reach.hasSemanticContext) {
				// we got nowhere on t, don't throw out this knowledge; it'd
				// cause a failover from DFA later.
				this.addDFAEdge(s, t, ATNSimulator.ERROR);
			}
			// stop when we can't match any more char
			return ATNSimulator.ERROR;
		}
		// Add an edge from s to target DFA found/created for reach
		return this.addDFAEdge(s, t, null, reach);
	};

	LexerATNSimulator.prototype.failOrAccept = function (prevAccept, input, reach, t) {
		if (this.prevAccept.dfaState !== null) {
			var lexerActionExecutor = prevAccept.dfaState.lexerActionExecutor;
			this.accept(input, lexerActionExecutor, this.startIndex, prevAccept.index, prevAccept.line, prevAccept.column);
			return prevAccept.dfaState.prediction;
		} else {
			// if no accept and EOF is first char, return EOF
			if (t === Token.EOF && input.index === this.startIndex) {
				return Token.EOF;
			}
			throw new LexerNoViableAltException(this.recog, input, this.startIndex, reach);
		}
	};

	// Given a starting configuration set, figure out all ATN configurations
	// we can reach upon input {@code t}. Parameter {@code reach} is a return
	// parameter.
	LexerATNSimulator.prototype.getReachableConfigSet = function (input, closure, reach, t) {
		// this is used to skip processing for configs which have a lower priority
		// than a config that already reached an accept state for the same rule
		var skipAlt = ATN.INVALID_ALT_NUMBER;
		for (var i = 0; i < closure.items.length; i++) {
			var cfg = closure.items[i];
			var currentAltReachedAcceptState = cfg.alt === skipAlt;
			if (currentAltReachedAcceptState && cfg.passedThroughNonGreedyDecision) {
				continue;
			}
			if (LexerATNSimulator.debug) {
				console.log("testing %s at %s\n", this.getTokenName(t), cfg.toString(this.recog, true));
			}
			for (var j = 0; j < cfg.state.transitions.length; j++) {
				var trans = cfg.state.transitions[j]; // for each transition
				var target = this.getReachableTarget(trans, t);
				if (target !== null) {
					var lexerActionExecutor = cfg.lexerActionExecutor;
					if (lexerActionExecutor !== null) {
						lexerActionExecutor = lexerActionExecutor.fixOffsetBeforeMatch(input.index - this.startIndex);
					}
					var treatEofAsEpsilon = t === Token.EOF;
					var config = new LexerATNConfig({ state: target, lexerActionExecutor: lexerActionExecutor }, cfg);
					if (this.closure(input, config, reach, currentAltReachedAcceptState, true, treatEofAsEpsilon)) {
						// any remaining configs for this alt have a lower priority
						// than the one that just reached an accept state.
						skipAlt = cfg.alt;
					}
				}
			}
		}
	};

	LexerATNSimulator.prototype.accept = function (input, lexerActionExecutor, startIndex, index, line, charPos) {
		if (LexerATNSimulator.debug) {
			console.log("ACTION %s\n", lexerActionExecutor);
		}
		// seek to after last char in token
		input.seek(index);
		this.line = line;
		this.column = charPos;
		if (lexerActionExecutor !== null && this.recog !== null) {
			lexerActionExecutor.execute(this.recog, input, startIndex);
		}
	};

	LexerATNSimulator.prototype.getReachableTarget = function (trans, t) {
		if (trans.matches(t, 0, Lexer.MAX_CHAR_VALUE)) {
			return trans.target;
		} else {
			return null;
		}
	};

	LexerATNSimulator.prototype.computeStartState = function (input, p) {
		var initialContext = PredictionContext.EMPTY;
		var configs = new OrderedATNConfigSet();
		for (var i = 0; i < p.transitions.length; i++) {
			var target = p.transitions[i].target;
			var cfg = new LexerATNConfig({ state: target, alt: i + 1, context: initialContext }, null);
			this.closure(input, cfg, configs, false, false, false);
		}
		return configs;
	};

	// Since the alternatives within any lexer decision are ordered by
	// preference, this method stops pursuing the closure as soon as an accept
	// state is reached. After the first accept state is reached by depth-first
	// search from {@code config}, all other (potentially reachable) states for
	// this rule would have a lower priority.
	//
	// @return {@code true} if an accept state is reached, otherwise
	// {@code false}.
	LexerATNSimulator.prototype.closure = function (input, config, configs, currentAltReachedAcceptState, speculative, treatEofAsEpsilon) {
		var cfg = null;
		if (LexerATNSimulator.debug) {
			console.log("closure(" + config.toString(this.recog, true) + ")");
		}
		if (config.state instanceof RuleStopState) {
			if (LexerATNSimulator.debug) {
				if (this.recog !== null) {
					console.log("closure at %s rule stop %s\n", this.recog.ruleNames[config.state.ruleIndex], config);
				} else {
					console.log("closure at rule stop %s\n", config);
				}
			}
			if (config.context === null || config.context.hasEmptyPath()) {
				if (config.context === null || config.context.isEmpty()) {
					configs.add(config);
					return true;
				} else {
					configs.add(new LexerATNConfig({ state: config.state, context: PredictionContext.EMPTY }, config));
					currentAltReachedAcceptState = true;
				}
			}
			if (config.context !== null && !config.context.isEmpty()) {
				for (var i = 0; i < config.context.length; i++) {
					if (config.context.getReturnState(i) !== PredictionContext.EMPTY_RETURN_STATE) {
						var newContext = config.context.getParent(i); // "pop" return state
						var returnState = this.atn.states[config.context.getReturnState(i)];
						cfg = new LexerATNConfig({ state: returnState, context: newContext }, config);
						currentAltReachedAcceptState = this.closure(input, cfg, configs, currentAltReachedAcceptState, speculative, treatEofAsEpsilon);
					}
				}
			}
			return currentAltReachedAcceptState;
		}
		// optimization
		if (!config.state.epsilonOnlyTransitions) {
			if (!currentAltReachedAcceptState || !config.passedThroughNonGreedyDecision) {
				configs.add(config);
			}
		}
		for (var j = 0; j < config.state.transitions.length; j++) {
			var trans = config.state.transitions[j];
			cfg = this.getEpsilonTarget(input, config, trans, configs, speculative, treatEofAsEpsilon);
			if (cfg !== null) {
				currentAltReachedAcceptState = this.closure(input, cfg, configs, currentAltReachedAcceptState, speculative, treatEofAsEpsilon);
			}
		}
		return currentAltReachedAcceptState;
	};

	// side-effect: can alter configs.hasSemanticContext
	LexerATNSimulator.prototype.getEpsilonTarget = function (input, config, trans, configs, speculative, treatEofAsEpsilon) {
		var cfg = null;
		if (trans.serializationType === Transition.RULE) {
			var newContext = SingletonPredictionContext.create(config.context, trans.followState.stateNumber);
			cfg = new LexerATNConfig({ state: trans.target, context: newContext }, config);
		} else if (trans.serializationType === Transition.PRECEDENCE) {
			throw "Precedence predicates are not supported in lexers.";
		} else if (trans.serializationType === Transition.PREDICATE) {
			// Track traversing semantic predicates. If we traverse,
			// we cannot add a DFA state for this "reach" computation
			// because the DFA would not test the predicate again in the
			// future. Rather than creating collections of semantic predicates
			// like v3 and testing them on prediction, v4 will test them on the
			// fly all the time using the ATN not the DFA. This is slower but
			// semantically it's not used that often. One of the key elements to
			// this predicate mechanism is not adding DFA states that see
			// predicates immediately afterwards in the ATN. For example,

			// a : ID {p1}? | ID {p2}? ;

			// should create the start state for rule 'a' (to save start state
			// competition), but should not create target of ID state. The
			// collection of ATN states the following ID references includes
			// states reached by traversing predicates. Since this is when we
			// test them, we cannot cash the DFA state target of ID.

			if (LexerATNSimulator.debug) {
				console.log("EVAL rule " + trans.ruleIndex + ":" + trans.predIndex);
			}
			configs.hasSemanticContext = true;
			if (this.evaluatePredicate(input, trans.ruleIndex, trans.predIndex, speculative)) {
				cfg = new LexerATNConfig({ state: trans.target }, config);
			}
		} else if (trans.serializationType === Transition.ACTION) {
			if (config.context === null || config.context.hasEmptyPath()) {
				// execute actions anywhere in the start rule for a token.
				//
				// TODO: if the entry rule is invoked recursively, some
				// actions may be executed during the recursive call. The
				// problem can appear when hasEmptyPath() is true but
				// isEmpty() is false. In this case, the config needs to be
				// split into two contexts - one with just the empty path
				// and another with everything but the empty path.
				// Unfortunately, the current algorithm does not allow
				// getEpsilonTarget to return two configurations, so
				// additional modifications are needed before we can support
				// the split operation.
				var lexerActionExecutor = LexerActionExecutor.append(config.lexerActionExecutor, this.atn.lexerActions[trans.actionIndex]);
				cfg = new LexerATNConfig({ state: trans.target, lexerActionExecutor: lexerActionExecutor }, config);
			} else {
				// ignore actions in referenced rules
				cfg = new LexerATNConfig({ state: trans.target }, config);
			}
		} else if (trans.serializationType === Transition.EPSILON) {
			cfg = new LexerATNConfig({ state: trans.target }, config);
		} else if (trans.serializationType === Transition.ATOM || trans.serializationType === Transition.RANGE || trans.serializationType === Transition.SET) {
			if (treatEofAsEpsilon) {
				if (trans.matches(Token.EOF, 0, Lexer.MAX_CHAR_VALUE)) {
					cfg = new LexerATNConfig({ state: trans.target }, config);
				}
			}
		}
		return cfg;
	};

	// Evaluate a predicate specified in the lexer.
	//
	// <p>If {@code speculative} is {@code true}, this method was called before
	// {@link //consume} for the matched character. This method should call
	// {@link //consume} before evaluating the predicate to ensure position
	// sensitive values, including {@link Lexer//getText}, {@link Lexer//getLine},
	// and {@link Lexer//getcolumn}, properly reflect the current
	// lexer state. This method should restore {@code input} and the simulator
	// to the original state before returning (i.e. undo the actions made by the
	// call to {@link //consume}.</p>
	//
	// @param input The input stream.
	// @param ruleIndex The rule containing the predicate.
	// @param predIndex The index of the predicate within the rule.
	// @param speculative {@code true} if the current index in {@code input} is
	// one character before the predicate's location.
	//
	// @return {@code true} if the specified predicate evaluates to
	// {@code true}.
	// /
	LexerATNSimulator.prototype.evaluatePredicate = function (input, ruleIndex, predIndex, speculative) {
		// assume true if no recognizer was provided
		if (this.recog === null) {
			return true;
		}
		if (!speculative) {
			return this.recog.sempred(null, ruleIndex, predIndex);
		}
		var savedcolumn = this.column;
		var savedLine = this.line;
		var index = input.index;
		var marker = input.mark();
		try {
			this.consume(input);
			return this.recog.sempred(null, ruleIndex, predIndex);
		} finally {
			this.column = savedcolumn;
			this.line = savedLine;
			input.seek(index);
			input.release(marker);
		}
	};

	LexerATNSimulator.prototype.captureSimState = function (settings, input, dfaState) {
		settings.index = input.index;
		settings.line = this.line;
		settings.column = this.column;
		settings.dfaState = dfaState;
	};

	LexerATNSimulator.prototype.addDFAEdge = function (from_, tk, to, cfgs) {
		if (to === undefined) {
			to = null;
		}
		if (cfgs === undefined) {
			cfgs = null;
		}
		if (to === null && cfgs !== null) {
			// leading to this call, ATNConfigSet.hasSemanticContext is used as a
			// marker indicating dynamic predicate evaluation makes this edge
			// dependent on the specific input sequence, so the static edge in the
			// DFA should be omitted. The target DFAState is still created since
			// execATN has the ability to resynchronize with the DFA state cache
			// following the predicate evaluation step.
			//
			// TJP notes: next time through the DFA, we see a pred again and eval.
			// If that gets us to a previously created (but dangling) DFA
			// state, we can continue in pure DFA mode from there.
			// /
			var suppressEdge = cfgs.hasSemanticContext;
			cfgs.hasSemanticContext = false;

			to = this.addDFAState(cfgs);

			if (suppressEdge) {
				return to;
			}
		}
		// add the edge
		if (tk < LexerATNSimulator.MIN_DFA_EDGE || tk > LexerATNSimulator.MAX_DFA_EDGE) {
			// Only track edges within the DFA bounds
			return to;
		}
		if (LexerATNSimulator.debug) {
			console.log("EDGE " + from_ + " -> " + to + " upon " + tk);
		}
		if (from_.edges === null) {
			// make room for tokens 1..n and -1 masquerading as index 0
			from_.edges = [];
		}
		from_.edges[tk - LexerATNSimulator.MIN_DFA_EDGE] = to; // connect

		return to;
	};

	// Add a new DFA state if there isn't one with this set of
	// configurations already. This method also detects the first
	// configuration containing an ATN rule stop state. Later, when
	// traversing the DFA, we will know which rule to accept.
	LexerATNSimulator.prototype.addDFAState = function (configs) {
		var proposed = new DFAState(null, configs);
		var firstConfigWithRuleStopState = null;
		for (var i = 0; i < configs.items.length; i++) {
			var cfg = configs.items[i];
			if (cfg.state instanceof RuleStopState) {
				firstConfigWithRuleStopState = cfg;
				break;
			}
		}
		if (firstConfigWithRuleStopState !== null) {
			proposed.isAcceptState = true;
			proposed.lexerActionExecutor = firstConfigWithRuleStopState.lexerActionExecutor;
			proposed.prediction = this.atn.ruleToTokenType[firstConfigWithRuleStopState.state.ruleIndex];
		}
		var dfa = this.decisionToDFA[this.mode];
		var existing = dfa.states.get(proposed);
		if (existing !== null) {
			return existing;
		}
		var newState = proposed;
		newState.stateNumber = dfa.states.length;
		configs.setReadonly(true);
		newState.configs = configs;
		dfa.states.add(newState);
		return newState;
	};

	LexerATNSimulator.prototype.getDFA = function (mode) {
		return this.decisionToDFA[mode];
	};

	// Get the text matched so far for the current token.
	LexerATNSimulator.prototype.getText = function (input) {
		// index is first lookahead char, don't include.
		return input.getText(this.startIndex, input.index - 1);
	};

	LexerATNSimulator.prototype.consume = function (input) {
		var curChar = input.LA(1);
		if (curChar === "\n".charCodeAt(0)) {
			this.line += 1;
			this.column = 0;
		} else {
			this.column += 1;
		}
		input.consume();
	};

	LexerATNSimulator.prototype.getTokenName = function (tt) {
		if (tt === -1) {
			return "EOF";
		} else {
			return "'" + String.fromCharCode(tt) + "'";
		}
	};

	exports.LexerATNSimulator = LexerATNSimulator;

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	// A lexer is recognizer that draws input symbols from a character stream.
	//  lexer grammars result in a subclass of this object. A Lexer object
	//  uses simplified match() and error recovery mechanisms in the interest of speed.

	var Token = __webpack_require__(6).Token;
	var Recognizer = __webpack_require__(23).Recognizer;
	var CommonTokenFactory = __webpack_require__(25).CommonTokenFactory;
	var RecognitionException = __webpack_require__(26).RecognitionException;
	var LexerNoViableAltException = __webpack_require__(26).LexerNoViableAltException;

	function TokenSource() {
		return this;
	}

	function Lexer(input) {
		Recognizer.call(this);
		this._input = input;
		this._factory = CommonTokenFactory.DEFAULT;
		this._tokenFactorySourcePair = [this, input];

		this._interp = null; // child classes must populate this

		// The goal of all lexer rules/methods is to create a token object.
		// this is an instance variable as multiple rules may collaborate to
		// create a single token. nextToken will return this object after
		// matching lexer rule(s). If you subclass to allow multiple token
		// emissions, then set this to the last token to be matched or
		// something nonnull so that the auto token emit mechanism will not
		// emit another token.
		this._token = null;

		// What character index in the stream did the current token start at?
		// Needed, for example, to get the text for current token. Set at
		// the start of nextToken.
		this._tokenStartCharIndex = -1;

		// The line on which the first character of the token resides///
		this._tokenStartLine = -1;

		// The character position of first character within the line///
		this._tokenStartColumn = -1;

		// Once we see EOF on char stream, next token will be EOF.
		// If you have DONE : EOF ; then you see DONE EOF.
		this._hitEOF = false;

		// The channel number for the current token///
		this._channel = Token.DEFAULT_CHANNEL;

		// The token type for the current token///
		this._type = Token.INVALID_TYPE;

		this._modeStack = [];
		this._mode = Lexer.DEFAULT_MODE;

		// You can set the text for the current token to override what is in
		// the input char buffer. Use setText() or can set this instance var.
		// /
		this._text = null;

		return this;
	}

	Lexer.prototype = Object.create(Recognizer.prototype);
	Lexer.prototype.constructor = Lexer;

	Lexer.DEFAULT_MODE = 0;
	Lexer.MORE = -2;
	Lexer.SKIP = -3;

	Lexer.DEFAULT_TOKEN_CHANNEL = Token.DEFAULT_CHANNEL;
	Lexer.HIDDEN = Token.HIDDEN_CHANNEL;
	Lexer.MIN_CHAR_VALUE = 0x0000;
	Lexer.MAX_CHAR_VALUE = 0x10FFFF;

	Lexer.prototype.reset = function () {
		// wack Lexer state variables
		if (this._input !== null) {
			this._input.seek(0); // rewind the input
		}
		this._token = null;
		this._type = Token.INVALID_TYPE;
		this._channel = Token.DEFAULT_CHANNEL;
		this._tokenStartCharIndex = -1;
		this._tokenStartColumn = -1;
		this._tokenStartLine = -1;
		this._text = null;

		this._hitEOF = false;
		this._mode = Lexer.DEFAULT_MODE;
		this._modeStack = [];

		this._interp.reset();
	};

	// Return a token from this source; i.e., match a token on the char stream.
	Lexer.prototype.nextToken = function () {
		if (this._input === null) {
			throw "nextToken requires a non-null input stream.";
		}

		// Mark start location in char stream so unbuffered streams are
		// guaranteed at least have text of current token
		var tokenStartMarker = this._input.mark();
		try {
			while (true) {
				if (this._hitEOF) {
					this.emitEOF();
					return this._token;
				}
				this._token = null;
				this._channel = Token.DEFAULT_CHANNEL;
				this._tokenStartCharIndex = this._input.index;
				this._tokenStartColumn = this._interp.column;
				this._tokenStartLine = this._interp.line;
				this._text = null;
				var continueOuter = false;
				while (true) {
					this._type = Token.INVALID_TYPE;
					var ttype = Lexer.SKIP;
					try {
						ttype = this._interp.match(this._input, this._mode);
					} catch (e) {
						if (e instanceof RecognitionException) {
							this.notifyListeners(e); // report error
							this.recover(e);
						} else {
							console.log(e.stack);
							throw e;
						}
					}
					if (this._input.LA(1) === Token.EOF) {
						this._hitEOF = true;
					}
					if (this._type === Token.INVALID_TYPE) {
						this._type = ttype;
					}
					if (this._type === Lexer.SKIP) {
						continueOuter = true;
						break;
					}
					if (this._type !== Lexer.MORE) {
						break;
					}
				}
				if (continueOuter) {
					continue;
				}
				if (this._token === null) {
					this.emit();
				}
				return this._token;
			}
		} finally {
			// make sure we release marker after match or
			// unbuffered char stream will keep buffering
			this._input.release(tokenStartMarker);
		}
	};

	// Instruct the lexer to skip creating a token for current lexer rule
	// and look for another token. nextToken() knows to keep looking when
	// a lexer rule finishes with token set to SKIP_TOKEN. Recall that
	// if token==null at end of any token rule, it creates one for you
	// and emits it.
	// /
	Lexer.prototype.skip = function () {
		this._type = Lexer.SKIP;
	};

	Lexer.prototype.more = function () {
		this._type = Lexer.MORE;
	};

	Lexer.prototype.mode = function (m) {
		this._mode = m;
	};

	Lexer.prototype.pushMode = function (m) {
		if (this._interp.debug) {
			console.log("pushMode " + m);
		}
		this._modeStack.push(this._mode);
		this.mode(m);
	};

	Lexer.prototype.popMode = function () {
		if (this._modeStack.length === 0) {
			throw "Empty Stack";
		}
		if (this._interp.debug) {
			console.log("popMode back to " + this._modeStack.slice(0, -1));
		}
		this.mode(this._modeStack.pop());
		return this._mode;
	};

	// Set the char stream and reset the lexer
	Object.defineProperty(Lexer.prototype, "inputStream", {
		get: function get() {
			return this._input;
		},
		set: function set(input) {
			this._input = null;
			this._tokenFactorySourcePair = [this, this._input];
			this.reset();
			this._input = input;
			this._tokenFactorySourcePair = [this, this._input];
		}
	});

	Object.defineProperty(Lexer.prototype, "sourceName", {
		get: function sourceName() {
			return this._input.sourceName;
		}
	});

	// By default does not support multiple emits per nextToken invocation
	// for efficiency reasons. Subclass and override this method, nextToken,
	// and getToken (to push tokens into a list and pull from that list
	// rather than a single variable as this implementation does).
	// /
	Lexer.prototype.emitToken = function (token) {
		this._token = token;
	};

	// The standard method called to automatically emit a token at the
	// outermost lexical rule. The token object should point into the
	// char buffer start..stop. If there is a text override in 'text',
	// use that to set the token's text. Override this method to emit
	// custom Token objects or provide a new factory.
	// /
	Lexer.prototype.emit = function () {
		var t = this._factory.create(this._tokenFactorySourcePair, this._type, this._text, this._channel, this._tokenStartCharIndex, this.getCharIndex() - 1, this._tokenStartLine, this._tokenStartColumn);
		this.emitToken(t);
		return t;
	};

	Lexer.prototype.emitEOF = function () {
		var cpos = this.column;
		var lpos = this.line;
		var eof = this._factory.create(this._tokenFactorySourcePair, Token.EOF, null, Token.DEFAULT_CHANNEL, this._input.index, this._input.index - 1, lpos, cpos);
		this.emitToken(eof);
		return eof;
	};

	Object.defineProperty(Lexer.prototype, "type", {
		get: function get() {
			return this.type;
		},
		set: function set(type) {
			this._type = type;
		}
	});

	Object.defineProperty(Lexer.prototype, "line", {
		get: function get() {
			return this._interp.line;
		},
		set: function set(line) {
			this._interp.line = line;
		}
	});

	Object.defineProperty(Lexer.prototype, "column", {
		get: function get() {
			return this._interp.column;
		},
		set: function set(column) {
			this._interp.column = column;
		}
	});

	// What is the index of the current character of lookahead?///
	Lexer.prototype.getCharIndex = function () {
		return this._input.index;
	};

	// Return the text matched so far for the current token or any text override.
	//Set the complete text of this token; it wipes any previous changes to the text.
	Object.defineProperty(Lexer.prototype, "text", {
		get: function get() {
			if (this._text !== null) {
				return this._text;
			} else {
				return this._interp.getText(this._input);
			}
		},
		set: function set(text) {
			this._text = text;
		}
	});
	// Return a list of all Token objects in input char stream.
	// Forces load of all tokens. Does not include EOF token.
	// /
	Lexer.prototype.getAllTokens = function () {
		var tokens = [];
		var t = this.nextToken();
		while (t.type !== Token.EOF) {
			tokens.push(t);
			t = this.nextToken();
		}
		return tokens;
	};

	Lexer.prototype.notifyListeners = function (e) {
		var start = this._tokenStartCharIndex;
		var stop = this._input.index;
		var text = this._input.getText(start, stop);
		var msg = "token recognition error at: '" + this.getErrorDisplay(text) + "'";
		var listener = this.getErrorListenerDispatch();
		listener.syntaxError(this, null, this._tokenStartLine, this._tokenStartColumn, msg, e);
	};

	Lexer.prototype.getErrorDisplay = function (s) {
		var d = [];
		for (var i = 0; i < s.length; i++) {
			d.push(s[i]);
		}
		return d.join('');
	};

	Lexer.prototype.getErrorDisplayForChar = function (c) {
		if (c.charCodeAt(0) === Token.EOF) {
			return "<EOF>";
		} else if (c === '\n') {
			return "\\n";
		} else if (c === '\t') {
			return "\\t";
		} else if (c === '\r') {
			return "\\r";
		} else {
			return c;
		}
	};

	Lexer.prototype.getCharErrorDisplay = function (c) {
		return "'" + this.getErrorDisplayForChar(c) + "'";
	};

	// Lexers can normally match any char in it's vocabulary after matching
	// a token, so do the easy thing and just kill a character and hope
	// it all works out. You can instead use the rule invocation stack
	// to do sophisticated error recovery if you are in a fragment rule.
	// /
	Lexer.prototype.recover = function (re) {
		if (this._input.LA(1) !== Token.EOF) {
			if (re instanceof LexerNoViableAltException) {
				// skip a char and try again
				this._interp.consume(this._input);
			} else {
				// TODO: Do we lose character or line position information?
				this._input.consume();
			}
		}
	};

	exports.Lexer = Lexer;

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	var Token = __webpack_require__(6).Token;
	var ConsoleErrorListener = __webpack_require__(24).ConsoleErrorListener;
	var ProxyErrorListener = __webpack_require__(24).ProxyErrorListener;

	function Recognizer() {
	    this._listeners = [ConsoleErrorListener.INSTANCE];
	    this._interp = null;
	    this._stateNumber = -1;
	    return this;
	}

	Recognizer.tokenTypeMapCache = {};
	Recognizer.ruleIndexMapCache = {};

	Recognizer.prototype.checkVersion = function (toolVersion) {
	    var runtimeVersion = "4.7";
	    if (runtimeVersion !== toolVersion) {
	        console.log("ANTLR runtime and generated code versions disagree: " + runtimeVersion + "!=" + toolVersion);
	    }
	};

	Recognizer.prototype.addErrorListener = function (listener) {
	    this._listeners.push(listener);
	};

	Recognizer.prototype.removeErrorListeners = function () {
	    this._listeners = [];
	};

	Recognizer.prototype.getTokenTypeMap = function () {
	    var tokenNames = this.getTokenNames();
	    if (tokenNames === null) {
	        throw "The current recognizer does not provide a list of token names.";
	    }
	    var result = this.tokenTypeMapCache[tokenNames];
	    if (result === undefined) {
	        result = tokenNames.reduce(function (o, k, i) {
	            o[k] = i;
	        });
	        result.EOF = Token.EOF;
	        this.tokenTypeMapCache[tokenNames] = result;
	    }
	    return result;
	};

	// Get a map from rule names to rule indexes.
	//
	// <p>Used for XPath and tree pattern compilation.</p>
	//
	Recognizer.prototype.getRuleIndexMap = function () {
	    var ruleNames = this.ruleNames;
	    if (ruleNames === null) {
	        throw "The current recognizer does not provide a list of rule names.";
	    }
	    var result = this.ruleIndexMapCache[ruleNames];
	    if (result === undefined) {
	        result = ruleNames.reduce(function (o, k, i) {
	            o[k] = i;
	        });
	        this.ruleIndexMapCache[ruleNames] = result;
	    }
	    return result;
	};

	Recognizer.prototype.getTokenType = function (tokenName) {
	    var ttype = this.getTokenTypeMap()[tokenName];
	    if (ttype !== undefined) {
	        return ttype;
	    } else {
	        return Token.INVALID_TYPE;
	    }
	};

	// What is the error header, normally line/character position information?//
	Recognizer.prototype.getErrorHeader = function (e) {
	    var line = e.getOffendingToken().line;
	    var column = e.getOffendingToken().column;
	    return "line " + line + ":" + column;
	};

	// How should a token be displayed in an error message? The default
	//  is to display just the text, but during development you might
	//  want to have a lot of information spit out.  Override in that case
	//  to use t.toString() (which, for CommonToken, dumps everything about
	//  the token). This is better than forcing you to override a method in
	//  your token objects because you don't have to go modify your lexer
	//  so that it creates a new Java type.
	//
	// @deprecated This method is not called by the ANTLR 4 Runtime. Specific
	// implementations of {@link ANTLRErrorStrategy} may provide a similar
	// feature when necessary. For example, see
	// {@link DefaultErrorStrategy//getTokenErrorDisplay}.
	//
	Recognizer.prototype.getTokenErrorDisplay = function (t) {
	    if (t === null) {
	        return "<no token>";
	    }
	    var s = t.text;
	    if (s === null) {
	        if (t.type === Token.EOF) {
	            s = "<EOF>";
	        } else {
	            s = "<" + t.type + ">";
	        }
	    }
	    s = s.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
	    return "'" + s + "'";
	};

	Recognizer.prototype.getErrorListenerDispatch = function () {
	    return new ProxyErrorListener(this._listeners);
	};

	// subclass needs to override these if there are sempreds or actions
	// that the ATN interp needs to execute
	Recognizer.prototype.sempred = function (localctx, ruleIndex, actionIndex) {
	    return true;
	};

	Recognizer.prototype.precpred = function (localctx, precedence) {
	    return true;
	};

	//Indicate that the recognizer has changed internal state that is
	//consistent with the ATN state passed in.  This way we always know
	//where we are in the ATN as the parser goes along. The rule
	//context objects form a stack that lets us see the stack of
	//invoking rules. Combine this and we have complete ATN
	//configuration information.

	Object.defineProperty(Recognizer.prototype, "state", {
	    get: function get() {
	        return this._stateNumber;
	    },
	    set: function set(state) {
	        this._stateNumber = state;
	    }
	});

	exports.Recognizer = Recognizer;

/***/ },
/* 24 */
/***/ function(module, exports) {

	"use strict";

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	// Provides an empty default implementation of {@link ANTLRErrorListener}. The
	// default implementation of each method does nothing, but can be overridden as
	// necessary.

	function ErrorListener() {
	  return this;
	}

	ErrorListener.prototype.syntaxError = function (recognizer, offendingSymbol, line, column, msg, e) {};

	ErrorListener.prototype.reportAmbiguity = function (recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs) {};

	ErrorListener.prototype.reportAttemptingFullContext = function (recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs) {};

	ErrorListener.prototype.reportContextSensitivity = function (recognizer, dfa, startIndex, stopIndex, prediction, configs) {};

	function ConsoleErrorListener() {
	  ErrorListener.call(this);
	  return this;
	}

	ConsoleErrorListener.prototype = Object.create(ErrorListener.prototype);
	ConsoleErrorListener.prototype.constructor = ConsoleErrorListener;

	//
	// Provides a default instance of {@link ConsoleErrorListener}.
	//
	ConsoleErrorListener.INSTANCE = new ConsoleErrorListener();

	//
	// {@inheritDoc}
	//
	// <p>
	// This implementation prints messages to {@link System//err} containing the
	// values of {@code line}, {@code charPositionInLine}, and {@code msg} using
	// the following format.</p>
	//
	// <pre>
	// line <em>line</em>:<em>charPositionInLine</em> <em>msg</em>
	// </pre>
	//
	ConsoleErrorListener.prototype.syntaxError = function (recognizer, offendingSymbol, line, column, msg, e) {
	  console.error("line " + line + ":" + column + " " + msg);
	};

	function ProxyErrorListener(delegates) {
	  ErrorListener.call(this);
	  if (delegates === null) {
	    throw "delegates";
	  }
	  this.delegates = delegates;
	  return this;
	}

	ProxyErrorListener.prototype = Object.create(ErrorListener.prototype);
	ProxyErrorListener.prototype.constructor = ProxyErrorListener;

	ProxyErrorListener.prototype.syntaxError = function (recognizer, offendingSymbol, line, column, msg, e) {
	  this.delegates.map(function (d) {
	    d.syntaxError(recognizer, offendingSymbol, line, column, msg, e);
	  });
	};

	ProxyErrorListener.prototype.reportAmbiguity = function (recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs) {
	  this.delegates.map(function (d) {
	    d.reportAmbiguity(recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs);
	  });
	};

	ProxyErrorListener.prototype.reportAttemptingFullContext = function (recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs) {
	  this.delegates.map(function (d) {
	    d.reportAttemptingFullContext(recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs);
	  });
	};

	ProxyErrorListener.prototype.reportContextSensitivity = function (recognizer, dfa, startIndex, stopIndex, prediction, configs) {
	  this.delegates.map(function (d) {
	    d.reportContextSensitivity(recognizer, dfa, startIndex, stopIndex, prediction, configs);
	  });
	};

	exports.ErrorListener = ErrorListener;
	exports.ConsoleErrorListener = ConsoleErrorListener;
	exports.ProxyErrorListener = ProxyErrorListener;

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	//
	// This default implementation of {@link TokenFactory} creates
	// {@link CommonToken} objects.
	//

	var CommonToken = __webpack_require__(6).CommonToken;

	function TokenFactory() {
	    return this;
	}

	function CommonTokenFactory(copyText) {
	    TokenFactory.call(this);
	    // Indicates whether {@link CommonToken//setText} should be called after
	    // constructing tokens to explicitly set the text. This is useful for cases
	    // where the input stream might not be able to provide arbitrary substrings
	    // of text from the input after the lexer creates a token (e.g. the
	    // implementation of {@link CharStream//getText} in
	    // {@link UnbufferedCharStream} throws an
	    // {@link UnsupportedOperationException}). Explicitly setting the token text
	    // allows {@link Token//getText} to be called at any time regardless of the
	    // input stream implementation.
	    //
	    // <p>
	    // The default value is {@code false} to avoid the performance and memory
	    // overhead of copying text for every token unless explicitly requested.</p>
	    //
	    this.copyText = copyText === undefined ? false : copyText;
	    return this;
	}

	CommonTokenFactory.prototype = Object.create(TokenFactory.prototype);
	CommonTokenFactory.prototype.constructor = CommonTokenFactory;

	//
	// The default {@link CommonTokenFactory} instance.
	//
	// <p>
	// This token factory does not explicitly copy token text when constructing
	// tokens.</p>
	//
	CommonTokenFactory.DEFAULT = new CommonTokenFactory();

	CommonTokenFactory.prototype.create = function (source, type, text, channel, start, stop, line, column) {
	    var t = new CommonToken(source, type, channel, start, stop);
	    t.line = line;
	    t.column = column;
	    if (text !== null) {
	        t.text = text;
	    } else if (this.copyText && source[1] !== null) {
	        t.text = source[1].getText(start, stop);
	    }
	    return t;
	};

	CommonTokenFactory.prototype.createThin = function (type, text) {
	    var t = new CommonToken(null, type);
	    t.text = text;
	    return t;
	};

	exports.CommonTokenFactory = CommonTokenFactory;

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	// The root of the ANTLR exception hierarchy. In general, ANTLR tracks just
	//  3 kinds of errors: prediction errors, failed predicate errors, and
	//  mismatched input errors. In each case, the parser knows where it is
	//  in the input, where it is in the ATN, the rule invocation stack,
	//  and what kind of problem occurred.

	var PredicateTransition = __webpack_require__(11).PredicateTransition;

	function RecognitionException(params) {
	    Error.call(this);
	    if (!!Error.captureStackTrace) {
	        Error.captureStackTrace(this, RecognitionException);
	    } else {
	        var stack = new Error().stack;
	    }
	    this.message = params.message;
	    this.recognizer = params.recognizer;
	    this.input = params.input;
	    this.ctx = params.ctx;
	    // The current {@link Token} when an error occurred. Since not all streams
	    // support accessing symbols by index, we have to track the {@link Token}
	    // instance itself.
	    this.offendingToken = null;
	    // Get the ATN state number the parser was in at the time the error
	    // occurred. For {@link NoViableAltException} and
	    // {@link LexerNoViableAltException} exceptions, this is the
	    // {@link DecisionState} number. For others, it is the state whose outgoing
	    // edge we couldn't match.
	    this.offendingState = -1;
	    if (this.recognizer !== null) {
	        this.offendingState = this.recognizer.state;
	    }
	    return this;
	}

	RecognitionException.prototype = Object.create(Error.prototype);
	RecognitionException.prototype.constructor = RecognitionException;

	// <p>If the state number is not known, this method returns -1.</p>

	//
	// Gets the set of input symbols which could potentially follow the
	// previously matched symbol at the time this exception was thrown.
	//
	// <p>If the set of expected tokens is not known and could not be computed,
	// this method returns {@code null}.</p>
	//
	// @return The set of token types that could potentially follow the current
	// state in the ATN, or {@code null} if the information is not available.
	// /
	RecognitionException.prototype.getExpectedTokens = function () {
	    if (this.recognizer !== null) {
	        return this.recognizer.atn.getExpectedTokens(this.offendingState, this.ctx);
	    } else {
	        return null;
	    }
	};

	RecognitionException.prototype.toString = function () {
	    return this.message;
	};

	function LexerNoViableAltException(lexer, input, startIndex, deadEndConfigs) {
	    RecognitionException.call(this, { message: "", recognizer: lexer, input: input, ctx: null });
	    this.startIndex = startIndex;
	    this.deadEndConfigs = deadEndConfigs;
	    return this;
	}

	LexerNoViableAltException.prototype = Object.create(RecognitionException.prototype);
	LexerNoViableAltException.prototype.constructor = LexerNoViableAltException;

	LexerNoViableAltException.prototype.toString = function () {
	    var symbol = "";
	    if (this.startIndex >= 0 && this.startIndex < this.input.size) {
	        symbol = this.input.getText((this.startIndex, this.startIndex));
	    }
	    return "LexerNoViableAltException" + symbol;
	};

	// Indicates that the parser could not decide which of two or more paths
	// to take based upon the remaining input. It tracks the starting token
	// of the offending input and also knows where the parser was
	// in the various paths when the error. Reported by reportNoViableAlternative()
	//
	function NoViableAltException(recognizer, input, startToken, offendingToken, deadEndConfigs, ctx) {
	    ctx = ctx || recognizer._ctx;
	    offendingToken = offendingToken || recognizer.getCurrentToken();
	    startToken = startToken || recognizer.getCurrentToken();
	    input = input || recognizer.getInputStream();
	    RecognitionException.call(this, { message: "", recognizer: recognizer, input: input, ctx: ctx });
	    // Which configurations did we try at input.index() that couldn't match
	    // input.LT(1)?//
	    this.deadEndConfigs = deadEndConfigs;
	    // The token object at the start index; the input stream might
	    // not be buffering tokens so get a reference to it. (At the
	    // time the error occurred, of course the stream needs to keep a
	    // buffer all of the tokens but later we might not have access to those.)
	    this.startToken = startToken;
	    this.offendingToken = offendingToken;
	}

	NoViableAltException.prototype = Object.create(RecognitionException.prototype);
	NoViableAltException.prototype.constructor = NoViableAltException;

	// This signifies any kind of mismatched input exceptions such as
	// when the current input does not match the expected token.
	//
	function InputMismatchException(recognizer) {
	    RecognitionException.call(this, { message: "", recognizer: recognizer, input: recognizer.getInputStream(), ctx: recognizer._ctx });
	    this.offendingToken = recognizer.getCurrentToken();
	}

	InputMismatchException.prototype = Object.create(RecognitionException.prototype);
	InputMismatchException.prototype.constructor = InputMismatchException;

	// A semantic predicate failed during validation. Validation of predicates
	// occurs when normally parsing the alternative just like matching a token.
	// Disambiguating predicate evaluation occurs when we test a predicate during
	// prediction.

	function FailedPredicateException(recognizer, predicate, message) {
	    RecognitionException.call(this, { message: this.formatMessage(predicate, message || null), recognizer: recognizer,
	        input: recognizer.getInputStream(), ctx: recognizer._ctx });
	    var s = recognizer._interp.atn.states[recognizer.state];
	    var trans = s.transitions[0];
	    if (trans instanceof PredicateTransition) {
	        this.ruleIndex = trans.ruleIndex;
	        this.predicateIndex = trans.predIndex;
	    } else {
	        this.ruleIndex = 0;
	        this.predicateIndex = 0;
	    }
	    this.predicate = predicate;
	    this.offendingToken = recognizer.getCurrentToken();
	    return this;
	}

	FailedPredicateException.prototype = Object.create(RecognitionException.prototype);
	FailedPredicateException.prototype.constructor = FailedPredicateException;

	FailedPredicateException.prototype.formatMessage = function (predicate, message) {
	    if (message !== null) {
	        return message;
	    } else {
	        return "failed predicate: {" + predicate + "}?";
	    }
	};

	function ParseCancellationException() {
	    Error.call(this);
	    Error.captureStackTrace(this, ParseCancellationException);
	    return this;
	}

	ParseCancellationException.prototype = Object.create(Error.prototype);
	ParseCancellationException.prototype.constructor = ParseCancellationException;

	exports.RecognitionException = RecognitionException;
	exports.NoViableAltException = NoViableAltException;
	exports.LexerNoViableAltException = LexerNoViableAltException;
	exports.InputMismatchException = InputMismatchException;
	exports.FailedPredicateException = FailedPredicateException;
	exports.ParseCancellationException = ParseCancellationException;

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	var DFAState = __webpack_require__(28).DFAState;
	var ATNConfigSet = __webpack_require__(29).ATNConfigSet;
	var getCachedPredictionContext = __webpack_require__(12).getCachedPredictionContext;

	function ATNSimulator(atn, sharedContextCache) {

	    // The context cache maps all PredictionContext objects that are ==
	    //  to a single cached copy. This cache is shared across all contexts
	    //  in all ATNConfigs in all DFA states.  We rebuild each ATNConfigSet
	    //  to use only cached nodes/graphs in addDFAState(). We don't want to
	    //  fill this during closure() since there are lots of contexts that
	    //  pop up but are not used ever again. It also greatly slows down closure().
	    //
	    //  <p>This cache makes a huge difference in memory and a little bit in speed.
	    //  For the Java grammar on java.*, it dropped the memory requirements
	    //  at the end from 25M to 16M. We don't store any of the full context
	    //  graphs in the DFA because they are limited to local context only,
	    //  but apparently there's a lot of repetition there as well. We optimize
	    //  the config contexts before storing the config set in the DFA states
	    //  by literally rebuilding them with cached subgraphs only.</p>
	    //
	    //  <p>I tried a cache for use during closure operations, that was
	    //  whacked after each adaptivePredict(). It cost a little bit
	    //  more time I think and doesn't save on the overall footprint
	    //  so it's not worth the complexity.</p>
	    ///
	    this.atn = atn;
	    this.sharedContextCache = sharedContextCache;
	    return this;
	}

	// Must distinguish between missing edge and edge we know leads nowhere///
	ATNSimulator.ERROR = new DFAState(0x7FFFFFFF, new ATNConfigSet());

	ATNSimulator.prototype.getCachedContext = function (context) {
	    if (this.sharedContextCache === null) {
	        return context;
	    }
	    var visited = {};
	    return getCachedPredictionContext(context, this.sharedContextCache, visited);
	};

	exports.ATNSimulator = ATNSimulator;

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	var ATNConfigSet = __webpack_require__(29).ATNConfigSet;
	var Utils = __webpack_require__(5);
	var Hash = Utils.Hash;
	var Set = Utils.Set;

	// Map a predicate to a predicted alternative.///

	function PredPrediction(pred, alt) {
		this.alt = alt;
		this.pred = pred;
		return this;
	}

	PredPrediction.prototype.toString = function () {
		return "(" + this.pred + ", " + this.alt + ")";
	};

	// A DFA state represents a set of possible ATN configurations.
	// As Aho, Sethi, Ullman p. 117 says "The DFA uses its state
	// to keep track of all possible states the ATN can be in after
	// reading each input symbol. That is to say, after reading
	// input a1a2..an, the DFA is in a state that represents the
	// subset T of the states of the ATN that are reachable from the
	// ATN's start state along some path labeled a1a2..an."
	// In conventional NFA&rarr;DFA conversion, therefore, the subset T
	// would be a bitset representing the set of states the
	// ATN could be in. We need to track the alt predicted by each
	// state as well, however. More importantly, we need to maintain
	// a stack of states, tracking the closure operations as they
	// jump from rule to rule, emulating rule invocations (method calls).
	// I have to add a stack to simulate the proper lookahead sequences for
	// the underlying LL grammar from which the ATN was derived.
	//
	// <p>I use a set of ATNConfig objects not simple states. An ATNConfig
	// is both a state (ala normal conversion) and a RuleContext describing
	// the chain of rules (if any) followed to arrive at that state.</p>
	//
	// <p>A DFA state may have multiple references to a particular state,
	// but with different ATN contexts (with same or different alts)
	// meaning that state was reached via a different set of rule invocations.</p>
	// /

	function DFAState(stateNumber, configs) {
		if (stateNumber === null) {
			stateNumber = -1;
		}
		if (configs === null) {
			configs = new ATNConfigSet();
		}
		this.stateNumber = stateNumber;
		this.configs = configs;
		// {@code edges[symbol]} points to target of symbol. Shift up by 1 so (-1)
		// {@link Token//EOF} maps to {@code edges[0]}.
		this.edges = null;
		this.isAcceptState = false;
		// if accept state, what ttype do we match or alt do we predict?
		// This is set to {@link ATN//INVALID_ALT_NUMBER} when {@link
		// //predicates}{@code !=null} or
		// {@link //requiresFullContext}.
		this.prediction = 0;
		this.lexerActionExecutor = null;
		// Indicates that this state was created during SLL prediction that
		// discovered a conflict between the configurations in the state. Future
		// {@link ParserATNSimulator//execATN} invocations immediately jumped doing
		// full context prediction if this field is true.
		this.requiresFullContext = false;
		// During SLL parsing, this is a list of predicates associated with the
		// ATN configurations of the DFA state. When we have predicates,
		// {@link //requiresFullContext} is {@code false} since full context
		// prediction evaluates predicates
		// on-the-fly. If this is not null, then {@link //prediction} is
		// {@link ATN//INVALID_ALT_NUMBER}.
		//
		// <p>We only use these for non-{@link //requiresFullContext} but
		// conflicting states. That
		// means we know from the context (it's $ or we don't dip into outer
		// context) that it's an ambiguity not a conflict.</p>
		//
		// <p>This list is computed by {@link
		// ParserATNSimulator//predicateDFAState}.</p>
		this.predicates = null;
		return this;
	}

	// Get the set of all alts mentioned by all ATN configurations in this
	// DFA state.
	DFAState.prototype.getAltSet = function () {
		var alts = new Set();
		if (this.configs !== null) {
			for (var i = 0; i < this.configs.length; i++) {
				var c = this.configs[i];
				alts.add(c.alt);
			}
		}
		if (alts.length === 0) {
			return null;
		} else {
			return alts;
		}
	};

	// Two {@link DFAState} instances are equal if their ATN configuration sets
	// are the same. This method is used to see if a state already exists.
	//
	// <p>Because the number of alternatives and number of ATN configurations are
	// finite, there is a finite number of DFA states that can be processed.
	// This is necessary to show that the algorithm terminates.</p>
	//
	// <p>Cannot test the DFA state numbers here because in
	// {@link ParserATNSimulator//addDFAState} we need to know if any other state
	// exists that has this exact set of ATN configurations. The
	// {@link //stateNumber} is irrelevant.</p>
	DFAState.prototype.equals = function (other) {
		// compare set of ATN configurations in this set with other
		return this === other || other instanceof DFAState && this.configs.equals(other.configs);
	};

	DFAState.prototype.toString = function () {
		var s = "" + this.stateNumber + ":" + this.configs;
		if (this.isAcceptState) {
			s = s + "=>";
			if (this.predicates !== null) s = s + this.predicates;else s = s + this.prediction;
		}
		return s;
	};

	DFAState.prototype.hashCode = function () {
		var hash = new Hash();
		hash.update(this.configs);
		if (this.isAcceptState) {
			if (this.predicates !== null) hash.update(this.predicates);else hash.update(this.prediction);
		}
		return hash.finish();
	};

	exports.DFAState = DFAState;
	exports.PredPrediction = PredPrediction;

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	//
	// Specialized {@link Set}{@code <}{@link ATNConfig}{@code >} that can track
	// info about the set, with support for combining similar configurations using a
	// graph-structured stack.
	///

	var ATN = __webpack_require__(3).ATN;
	var Utils = __webpack_require__(5);
	var Hash = Utils.Hash;
	var Set = Utils.Set;
	var SemanticContext = __webpack_require__(9).SemanticContext;
	var merge = __webpack_require__(12).merge;

	function hashATNConfig(c) {
		return c.hashCodeForConfigSet();
	}

	function equalATNConfigs(a, b) {
		if (a === b) {
			return true;
		} else if (a === null || b === null) {
			return false;
		} else return a.equalsForConfigSet(b);
	}

	function ATNConfigSet(fullCtx) {
		//
		// The reason that we need this is because we don't want the hash map to use
		// the standard hash code and equals. We need all configurations with the
		// same
		// {@code (s,i,_,semctx)} to be equal. Unfortunately, this key effectively
		// doubles
		// the number of objects associated with ATNConfigs. The other solution is
		// to
		// use a hash table that lets us specify the equals/hashcode operation.
		// All configs but hashed by (s, i, _, pi) not including context. Wiped out
		// when we go readonly as this set becomes a DFA state.
		this.configLookup = new Set(hashATNConfig, equalATNConfigs);
		// Indicates that this configuration set is part of a full context
		// LL prediction. It will be used to determine how to merge $. With SLL
		// it's a wildcard whereas it is not for LL context merge.
		this.fullCtx = fullCtx === undefined ? true : fullCtx;
		// Indicates that the set of configurations is read-only. Do not
		// allow any code to manipulate the set; DFA states will point at
		// the sets and they must not change. This does not protect the other
		// fields; in particular, conflictingAlts is set after
		// we've made this readonly.
		this.readOnly = false;
		// Track the elements as they are added to the set; supports get(i)///
		this.configs = [];

		// TODO: these fields make me pretty uncomfortable but nice to pack up info
		// together, saves recomputation
		// TODO: can we track conflicts as they are added to save scanning configs
		// later?
		this.uniqueAlt = 0;
		this.conflictingAlts = null;

		// Used in parser and lexer. In lexer, it indicates we hit a pred
		// while computing a closure operation. Don't make a DFA state from this.
		this.hasSemanticContext = false;
		this.dipsIntoOuterContext = false;

		this.cachedHashCode = -1;

		return this;
	}

	// Adding a new config means merging contexts with existing configs for
	// {@code (s, i, pi, _)}, where {@code s} is the
	// {@link ATNConfig//state}, {@code i} is the {@link ATNConfig//alt}, and
	// {@code pi} is the {@link ATNConfig//semanticContext}. We use
	// {@code (s,i,pi)} as key.
	//
	// <p>This method updates {@link //dipsIntoOuterContext} and
	// {@link //hasSemanticContext} when necessary.</p>
	// /
	ATNConfigSet.prototype.add = function (config, mergeCache) {
		if (mergeCache === undefined) {
			mergeCache = null;
		}
		if (this.readOnly) {
			throw "This set is readonly";
		}
		if (config.semanticContext !== SemanticContext.NONE) {
			this.hasSemanticContext = true;
		}
		if (config.reachesIntoOuterContext > 0) {
			this.dipsIntoOuterContext = true;
		}
		var existing = this.configLookup.add(config);
		if (existing === config) {
			this.cachedHashCode = -1;
			this.configs.push(config); // track order here
			return true;
		}
		// a previous (s,i,pi,_), merge with it and save result
		var rootIsWildcard = !this.fullCtx;
		var merged = merge(existing.context, config.context, rootIsWildcard, mergeCache);
		// no need to check for existing.context, config.context in cache
		// since only way to create new graphs is "call rule" and here. We
		// cache at both places.
		existing.reachesIntoOuterContext = Math.max(existing.reachesIntoOuterContext, config.reachesIntoOuterContext);
		// make sure to preserve the precedence filter suppression during the merge
		if (config.precedenceFilterSuppressed) {
			existing.precedenceFilterSuppressed = true;
		}
		existing.context = merged; // replace context; no need to alt mapping
		return true;
	};

	ATNConfigSet.prototype.getStates = function () {
		var states = new Set();
		for (var i = 0; i < this.configs.length; i++) {
			states.add(this.configs[i].state);
		}
		return states;
	};

	ATNConfigSet.prototype.getPredicates = function () {
		var preds = [];
		for (var i = 0; i < this.configs.length; i++) {
			var c = this.configs[i].semanticContext;
			if (c !== SemanticContext.NONE) {
				preds.push(c.semanticContext);
			}
		}
		return preds;
	};

	Object.defineProperty(ATNConfigSet.prototype, "items", {
		get: function get() {
			return this.configs;
		}
	});

	ATNConfigSet.prototype.optimizeConfigs = function (interpreter) {
		if (this.readOnly) {
			throw "This set is readonly";
		}
		if (this.configLookup.length === 0) {
			return;
		}
		for (var i = 0; i < this.configs.length; i++) {
			var config = this.configs[i];
			config.context = interpreter.getCachedContext(config.context);
		}
	};

	ATNConfigSet.prototype.addAll = function (coll) {
		for (var i = 0; i < coll.length; i++) {
			this.add(coll[i]);
		}
		return false;
	};

	ATNConfigSet.prototype.equals = function (other) {
		return this === other || other instanceof ATNConfigSet && Utils.equalArrays(this.configs, other.configs) && this.fullCtx === other.fullCtx && this.uniqueAlt === other.uniqueAlt && this.conflictingAlts === other.conflictingAlts && this.hasSemanticContext === other.hasSemanticContext && this.dipsIntoOuterContext === other.dipsIntoOuterContext;
	};

	ATNConfigSet.prototype.hashCode = function () {
		var hash = new Hash();
		this.updateHashCode(hash);
		return hash.finish();
	};

	ATNConfigSet.prototype.updateHashCode = function (hash) {
		if (this.readOnly) {
			if (this.cachedHashCode === -1) {
				var hash = new Hash();
				hash.update(this.configs);
				this.cachedHashCode = hash.finish();
			}
			hash.update(this.cachedHashCode);
		} else {
			hash.update(this.configs);
		}
	};

	Object.defineProperty(ATNConfigSet.prototype, "length", {
		get: function get() {
			return this.configs.length;
		}
	});

	ATNConfigSet.prototype.isEmpty = function () {
		return this.configs.length === 0;
	};

	ATNConfigSet.prototype.contains = function (item) {
		if (this.configLookup === null) {
			throw "This method is not implemented for readonly sets.";
		}
		return this.configLookup.contains(item);
	};

	ATNConfigSet.prototype.containsFast = function (item) {
		if (this.configLookup === null) {
			throw "This method is not implemented for readonly sets.";
		}
		return this.configLookup.containsFast(item);
	};

	ATNConfigSet.prototype.clear = function () {
		if (this.readOnly) {
			throw "This set is readonly";
		}
		this.configs = [];
		this.cachedHashCode = -1;
		this.configLookup = new Set();
	};

	ATNConfigSet.prototype.setReadonly = function (readOnly) {
		this.readOnly = readOnly;
		if (readOnly) {
			this.configLookup = null; // can't mod, no need for lookup cache
		}
	};

	ATNConfigSet.prototype.toString = function () {
		return Utils.arrayToString(this.configs) + (this.hasSemanticContext ? ",hasSemanticContext=" + this.hasSemanticContext : "") + (this.uniqueAlt !== ATN.INVALID_ALT_NUMBER ? ",uniqueAlt=" + this.uniqueAlt : "") + (this.conflictingAlts !== null ? ",conflictingAlts=" + this.conflictingAlts : "") + (this.dipsIntoOuterContext ? ",dipsIntoOuterContext" : "");
	};

	function OrderedATNConfigSet() {
		ATNConfigSet.call(this);
		this.configLookup = new Set();
		return this;
	}

	OrderedATNConfigSet.prototype = Object.create(ATNConfigSet.prototype);
	OrderedATNConfigSet.prototype.constructor = OrderedATNConfigSet;

	exports.ATNConfigSet = ATNConfigSet;
	exports.OrderedATNConfigSet = OrderedATNConfigSet;

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	// Represents an executor for a sequence of lexer actions which traversed during
	// the matching operation of a lexer rule (token).
	//
	// <p>The executor tracks position information for position-dependent lexer actions
	// efficiently, ensuring that actions appearing only at the end of the rule do
	// not cause bloating of the {@link DFA} created for the lexer.</p>

	var hashStuff = __webpack_require__(5).hashStuff;
	var LexerIndexedCustomAction = __webpack_require__(20).LexerIndexedCustomAction;

	function LexerActionExecutor(lexerActions) {
		this.lexerActions = lexerActions === null ? [] : lexerActions;
		// Caches the result of {@link //hashCode} since the hash code is an element
		// of the performance-critical {@link LexerATNConfig//hashCode} operation.
		this.cachedHashCode = hashStuff(lexerActions); // "".join([str(la) for la in
		// lexerActions]))
		return this;
	}

	// Creates a {@link LexerActionExecutor} which executes the actions for
	// the input {@code lexerActionExecutor} followed by a specified
	// {@code lexerAction}.
	//
	// @param lexerActionExecutor The executor for actions already traversed by
	// the lexer while matching a token within a particular
	// {@link LexerATNConfig}. If this is {@code null}, the method behaves as
	// though it were an empty executor.
	// @param lexerAction The lexer action to execute after the actions
	// specified in {@code lexerActionExecutor}.
	//
	// @return A {@link LexerActionExecutor} for executing the combine actions
	// of {@code lexerActionExecutor} and {@code lexerAction}.
	LexerActionExecutor.append = function (lexerActionExecutor, lexerAction) {
		if (lexerActionExecutor === null) {
			return new LexerActionExecutor([lexerAction]);
		}
		var lexerActions = lexerActionExecutor.lexerActions.concat([lexerAction]);
		return new LexerActionExecutor(lexerActions);
	};

	// Creates a {@link LexerActionExecutor} which encodes the current offset
	// for position-dependent lexer actions.
	//
	// <p>Normally, when the executor encounters lexer actions where
	// {@link LexerAction//isPositionDependent} returns {@code true}, it calls
	// {@link IntStream//seek} on the input {@link CharStream} to set the input
	// position to the <em>end</em> of the current token. This behavior provides
	// for efficient DFA representation of lexer actions which appear at the end
	// of a lexer rule, even when the lexer rule matches a variable number of
	// characters.</p>
	//
	// <p>Prior to traversing a match transition in the ATN, the current offset
	// from the token start index is assigned to all position-dependent lexer
	// actions which have not already been assigned a fixed offset. By storing
	// the offsets relative to the token start index, the DFA representation of
	// lexer actions which appear in the middle of tokens remains efficient due
	// to sharing among tokens of the same length, regardless of their absolute
	// position in the input stream.</p>
	//
	// <p>If the current executor already has offsets assigned to all
	// position-dependent lexer actions, the method returns {@code this}.</p>
	//
	// @param offset The current offset to assign to all position-dependent
	// lexer actions which do not already have offsets assigned.
	//
	// @return A {@link LexerActionExecutor} which stores input stream offsets
	// for all position-dependent lexer actions.
	// /
	LexerActionExecutor.prototype.fixOffsetBeforeMatch = function (offset) {
		var updatedLexerActions = null;
		for (var i = 0; i < this.lexerActions.length; i++) {
			if (this.lexerActions[i].isPositionDependent && !(this.lexerActions[i] instanceof LexerIndexedCustomAction)) {
				if (updatedLexerActions === null) {
					updatedLexerActions = this.lexerActions.concat([]);
				}
				updatedLexerActions[i] = new LexerIndexedCustomAction(offset, this.lexerActions[i]);
			}
		}
		if (updatedLexerActions === null) {
			return this;
		} else {
			return new LexerActionExecutor(updatedLexerActions);
		}
	};

	// Execute the actions encapsulated by this executor within the context of a
	// particular {@link Lexer}.
	//
	// <p>This method calls {@link IntStream//seek} to set the position of the
	// {@code input} {@link CharStream} prior to calling
	// {@link LexerAction//execute} on a position-dependent action. Before the
	// method returns, the input position will be restored to the same position
	// it was in when the method was invoked.</p>
	//
	// @param lexer The lexer instance.
	// @param input The input stream which is the source for the current token.
	// When this method is called, the current {@link IntStream//index} for
	// {@code input} should be the start of the following token, i.e. 1
	// character past the end of the current token.
	// @param startIndex The token start index. This value may be passed to
	// {@link IntStream//seek} to set the {@code input} position to the beginning
	// of the token.
	// /
	LexerActionExecutor.prototype.execute = function (lexer, input, startIndex) {
		var requiresSeek = false;
		var stopIndex = input.index;
		try {
			for (var i = 0; i < this.lexerActions.length; i++) {
				var lexerAction = this.lexerActions[i];
				if (lexerAction instanceof LexerIndexedCustomAction) {
					var offset = lexerAction.offset;
					input.seek(startIndex + offset);
					lexerAction = lexerAction.action;
					requiresSeek = startIndex + offset !== stopIndex;
				} else if (lexerAction.isPositionDependent) {
					input.seek(stopIndex);
					requiresSeek = false;
				}
				lexerAction.execute(lexer);
			}
		} finally {
			if (requiresSeek) {
				input.seek(stopIndex);
			}
		}
	};

	LexerActionExecutor.prototype.hashCode = function () {
		return this.cachedHashCode;
	};

	LexerActionExecutor.prototype.updateHashCode = function (hash) {
		hash.update(this.cachedHashCode);
	};

	LexerActionExecutor.prototype.equals = function (other) {
		if (this === other) {
			return true;
		} else if (!(other instanceof LexerActionExecutor)) {
			return false;
		} else if (this.cachedHashCode != other.cachedHashCode) {
			return false;
		} else if (this.lexerActions.length != other.lexerActions.length) {
			return false;
		} else {
			var numActions = this.lexerActions.length;
			for (var idx = 0; idx < numActions; ++idx) {
				if (!this.lexerActions[idx].equals(other.lexerActions[idx])) {
					return false;
				}
			}
			return true;
		}
	};

	exports.LexerActionExecutor = LexerActionExecutor;

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	//
	// The embodiment of the adaptive LL(*), ALL(*), parsing strategy.
	//
	// <p>
	// The basic complexity of the adaptive strategy makes it harder to understand.
	// We begin with ATN simulation to build paths in a DFA. Subsequent prediction
	// requests go through the DFA first. If they reach a state without an edge for
	// the current symbol, the algorithm fails over to the ATN simulation to
	// complete the DFA path for the current input (until it finds a conflict state
	// or uniquely predicting state).</p>
	//
	// <p>
	// All of that is done without using the outer context because we want to create
	// a DFA that is not dependent upon the rule invocation stack when we do a
	// prediction. One DFA works in all contexts. We avoid using context not
	// necessarily because it's slower, although it can be, but because of the DFA
	// caching problem. The closure routine only considers the rule invocation stack
	// created during prediction beginning in the decision rule. For example, if
	// prediction occurs without invoking another rule's ATN, there are no context
	// stacks in the configurations. When lack of context leads to a conflict, we
	// don't know if it's an ambiguity or a weakness in the strong LL(*) parsing
	// strategy (versus full LL(*)).</p>
	//
	// <p>
	// When SLL yields a configuration set with conflict, we rewind the input and
	// retry the ATN simulation, this time using full outer context without adding
	// to the DFA. Configuration context stacks will be the full invocation stacks
	// from the start rule. If we get a conflict using full context, then we can
	// definitively say we have a true ambiguity for that input sequence. If we
	// don't get a conflict, it implies that the decision is sensitive to the outer
	// context. (It is not context-sensitive in the sense of context-sensitive
	// grammars.)</p>
	//
	// <p>
	// The next time we reach this DFA state with an SLL conflict, through DFA
	// simulation, we will again retry the ATN simulation using full context mode.
	// This is slow because we can't save the results and have to "interpret" the
	// ATN each time we get that input.</p>
	//
	// <p>
	// <strong>CACHING FULL CONTEXT PREDICTIONS</strong></p>
	//
	// <p>
	// We could cache results from full context to predicted alternative easily and
	// that saves a lot of time but doesn't work in presence of predicates. The set
	// of visible predicates from the ATN start state changes depending on the
	// context, because closure can fall off the end of a rule. I tried to cache
	// tuples (stack context, semantic context, predicted alt) but it was slower
	// than interpreting and much more complicated. Also required a huge amount of
	// memory. The goal is not to create the world's fastest parser anyway. I'd like
	// to keep this algorithm simple. By launching multiple threads, we can improve
	// the speed of parsing across a large number of files.</p>
	//
	// <p>
	// There is no strict ordering between the amount of input used by SLL vs LL,
	// which makes it really hard to build a cache for full context. Let's say that
	// we have input A B C that leads to an SLL conflict with full context X. That
	// implies that using X we might only use A B but we could also use A B C D to
	// resolve conflict. Input A B C D could predict alternative 1 in one position
	// in the input and A B C E could predict alternative 2 in another position in
	// input. The conflicting SLL configurations could still be non-unique in the
	// full context prediction, which would lead us to requiring more input than the
	// original A B C.	To make a	prediction cache work, we have to track	the exact
	// input	used during the previous prediction. That amounts to a cache that maps
	// X to a specific DFA for that context.</p>
	//
	// <p>
	// Something should be done for left-recursive expression predictions. They are
	// likely LL(1) + pred eval. Easier to do the whole SLL unless error and retry
	// with full LL thing Sam does.</p>
	//
	// <p>
	// <strong>AVOIDING FULL CONTEXT PREDICTION</strong></p>
	//
	// <p>
	// We avoid doing full context retry when the outer context is empty, we did not
	// dip into the outer context by falling off the end of the decision state rule,
	// or when we force SLL mode.</p>
	//
	// <p>
	// As an example of the not dip into outer context case, consider as super
	// constructor calls versus function calls. One grammar might look like
	// this:</p>
	//
	// <pre>
	// ctorBody
	//   : '{' superCall? stat* '}'
	//   ;
	// </pre>
	//
	// <p>
	// Or, you might see something like</p>
	//
	// <pre>
	// stat
	//   : superCall ';'
	//   | expression ';'
	//   | ...
	//   ;
	// </pre>
	//
	// <p>
	// In both cases I believe that no closure operations will dip into the outer
	// context. In the first case ctorBody in the worst case will stop at the '}'.
	// In the 2nd case it should stop at the ';'. Both cases should stay within the
	// entry rule and not dip into the outer context.</p>
	//
	// <p>
	// <strong>PREDICATES</strong></p>
	//
	// <p>
	// Predicates are always evaluated if present in either SLL or LL both. SLL and
	// LL simulation deals with predicates differently. SLL collects predicates as
	// it performs closure operations like ANTLR v3 did. It delays predicate
	// evaluation until it reaches and accept state. This allows us to cache the SLL
	// ATN simulation whereas, if we had evaluated predicates on-the-fly during
	// closure, the DFA state configuration sets would be different and we couldn't
	// build up a suitable DFA.</p>
	//
	// <p>
	// When building a DFA accept state during ATN simulation, we evaluate any
	// predicates and return the sole semantically valid alternative. If there is
	// more than 1 alternative, we report an ambiguity. If there are 0 alternatives,
	// we throw an exception. Alternatives without predicates act like they have
	// true predicates. The simple way to think about it is to strip away all
	// alternatives with false predicates and choose the minimum alternative that
	// remains.</p>
	//
	// <p>
	// When we start in the DFA and reach an accept state that's predicated, we test
	// those and return the minimum semantically viable alternative. If no
	// alternatives are viable, we throw an exception.</p>
	//
	// <p>
	// During full LL ATN simulation, closure always evaluates predicates and
	// on-the-fly. This is crucial to reducing the configuration set size during
	// closure. It hits a landmine when parsing with the Java grammar, for example,
	// without this on-the-fly evaluation.</p>
	//
	// <p>
	// <strong>SHARING DFA</strong></p>
	//
	// <p>
	// All instances of the same parser share the same decision DFAs through a
	// static field. Each instance gets its own ATN simulator but they share the
	// same {@link //decisionToDFA} field. They also share a
	// {@link PredictionContextCache} object that makes sure that all
	// {@link PredictionContext} objects are shared among the DFA states. This makes
	// a big size difference.</p>
	//
	// <p>
	// <strong>THREAD SAFETY</strong></p>
	//
	// <p>
	// The {@link ParserATNSimulator} locks on the {@link //decisionToDFA} field when
	// it adds a new DFA object to that array. {@link //addDFAEdge}
	// locks on the DFA for the current decision when setting the
	// {@link DFAState//edges} field. {@link //addDFAState} locks on
	// the DFA for the current decision when looking up a DFA state to see if it
	// already exists. We must make sure that all requests to add DFA states that
	// are equivalent result in the same shared DFA object. This is because lots of
	// threads will be trying to update the DFA at once. The
	// {@link //addDFAState} method also locks inside the DFA lock
	// but this time on the shared context cache when it rebuilds the
	// configurations' {@link PredictionContext} objects using cached
	// subgraphs/nodes. No other locking occurs, even during DFA simulation. This is
	// safe as long as we can guarantee that all threads referencing
	// {@code s.edge[t]} get the same physical target {@link DFAState}, or
	// {@code null}. Once into the DFA, the DFA simulation does not reference the
	// {@link DFA//states} map. It follows the {@link DFAState//edges} field to new
	// targets. The DFA simulator will either find {@link DFAState//edges} to be
	// {@code null}, to be non-{@code null} and {@code dfa.edges[t]} null, or
	// {@code dfa.edges[t]} to be non-null. The
	// {@link //addDFAEdge} method could be racing to set the field
	// but in either case the DFA simulator works; if {@code null}, and requests ATN
	// simulation. It could also race trying to get {@code dfa.edges[t]}, but either
	// way it will work because it's not doing a test and set operation.</p>
	//
	// <p>
	// <strong>Starting with SLL then failing to combined SLL/LL (Two-Stage
	// Parsing)</strong></p>
	//
	// <p>
	// Sam pointed out that if SLL does not give a syntax error, then there is no
	// point in doing full LL, which is slower. We only have to try LL if we get a
	// syntax error. For maximum speed, Sam starts the parser set to pure SLL
	// mode with the {@link BailErrorStrategy}:</p>
	//
	// <pre>
	// parser.{@link Parser//getInterpreter() getInterpreter()}.{@link //setPredictionMode setPredictionMode}{@code (}{@link PredictionMode//SLL}{@code )};
	// parser.{@link Parser//setErrorHandler setErrorHandler}(new {@link BailErrorStrategy}());
	// </pre>
	//
	// <p>
	// If it does not get a syntax error, then we're done. If it does get a syntax
	// error, we need to retry with the combined SLL/LL strategy.</p>
	//
	// <p>
	// The reason this works is as follows. If there are no SLL conflicts, then the
	// grammar is SLL (at least for that input set). If there is an SLL conflict,
	// the full LL analysis must yield a set of viable alternatives which is a
	// subset of the alternatives reported by SLL. If the LL set is a singleton,
	// then the grammar is LL but not SLL. If the LL set is the same size as the SLL
	// set, the decision is SLL. If the LL set has size &gt; 1, then that decision
	// is truly ambiguous on the current input. If the LL set is smaller, then the
	// SLL conflict resolution might choose an alternative that the full LL would
	// rule out as a possibility based upon better context information. If that's
	// the case, then the SLL parse will definitely get an error because the full LL
	// analysis says it's not viable. If SLL conflict resolution chooses an
	// alternative within the LL set, them both SLL and LL would choose the same
	// alternative because they both choose the minimum of multiple conflicting
	// alternatives.</p>
	//
	// <p>
	// Let's say we have a set of SLL conflicting alternatives {@code {1, 2, 3}} and
	// a smaller LL set called <em>s</em>. If <em>s</em> is {@code {2, 3}}, then SLL
	// parsing will get an error because SLL will pursue alternative 1. If
	// <em>s</em> is {@code {1, 2}} or {@code {1, 3}} then both SLL and LL will
	// choose the same alternative because alternative one is the minimum of either
	// set. If <em>s</em> is {@code {2}} or {@code {3}} then SLL will get a syntax
	// error. If <em>s</em> is {@code {1}} then SLL will succeed.</p>
	//
	// <p>
	// Of course, if the input is invalid, then we will get an error for sure in
	// both SLL and LL parsing. Erroneous input will therefore require 2 passes over
	// the input.</p>
	//

	var Utils = __webpack_require__(5);
	var Set = Utils.Set;
	var BitSet = Utils.BitSet;
	var DoubleDict = Utils.DoubleDict;
	var ATN = __webpack_require__(3).ATN;
	var ATNState = __webpack_require__(8).ATNState;
	var ATNConfig = __webpack_require__(7).ATNConfig;
	var ATNConfigSet = __webpack_require__(29).ATNConfigSet;
	var Token = __webpack_require__(6).Token;
	var DFAState = __webpack_require__(28).DFAState;
	var PredPrediction = __webpack_require__(28).PredPrediction;
	var ATNSimulator = __webpack_require__(27).ATNSimulator;
	var PredictionMode = __webpack_require__(32).PredictionMode;
	var RuleContext = __webpack_require__(13).RuleContext;
	var ParserRuleContext = __webpack_require__(16).ParserRuleContext;
	var SemanticContext = __webpack_require__(9).SemanticContext;
	var StarLoopEntryState = __webpack_require__(8).StarLoopEntryState;
	var RuleStopState = __webpack_require__(8).RuleStopState;
	var PredictionContext = __webpack_require__(12).PredictionContext;
	var Interval = __webpack_require__(10).Interval;
	var Transitions = __webpack_require__(11);
	var Transition = Transitions.Transition;
	var SetTransition = Transitions.SetTransition;
	var NotSetTransition = Transitions.NotSetTransition;
	var RuleTransition = Transitions.RuleTransition;
	var ActionTransition = Transitions.ActionTransition;
	var NoViableAltException = __webpack_require__(26).NoViableAltException;

	var SingletonPredictionContext = __webpack_require__(12).SingletonPredictionContext;
	var predictionContextFromRuleContext = __webpack_require__(12).predictionContextFromRuleContext;

	function ParserATNSimulator(parser, atn, decisionToDFA, sharedContextCache) {
	    ATNSimulator.call(this, atn, sharedContextCache);
	    this.parser = parser;
	    this.decisionToDFA = decisionToDFA;
	    // SLL, LL, or LL + exact ambig detection?//
	    this.predictionMode = PredictionMode.LL;
	    // LAME globals to avoid parameters!!!!! I need these down deep in predTransition
	    this._input = null;
	    this._startIndex = 0;
	    this._outerContext = null;
	    this._dfa = null;
	    // Each prediction operation uses a cache for merge of prediction contexts.
	    //  Don't keep around as it wastes huge amounts of memory. DoubleKeyMap
	    //  isn't synchronized but we're ok since two threads shouldn't reuse same
	    //  parser/atnsim object because it can only handle one input at a time.
	    //  This maps graphs a and b to merged result c. (a,b)&rarr;c. We can avoid
	    //  the merge if we ever see a and b again.  Note that (b,a)&rarr;c should
	    //  also be examined during cache lookup.
	    //
	    this.mergeCache = null;
	    return this;
	}

	ParserATNSimulator.prototype = Object.create(ATNSimulator.prototype);
	ParserATNSimulator.prototype.constructor = ParserATNSimulator;

	ParserATNSimulator.prototype.debug = false;
	ParserATNSimulator.prototype.debug_closure = false;
	ParserATNSimulator.prototype.debug_add = false;
	ParserATNSimulator.prototype.debug_list_atn_decisions = false;
	ParserATNSimulator.prototype.dfa_debug = false;
	ParserATNSimulator.prototype.retry_debug = false;

	ParserATNSimulator.prototype.reset = function () {};

	ParserATNSimulator.prototype.adaptivePredict = function (input, decision, outerContext) {
	    if (this.debug || this.debug_list_atn_decisions) {
	        console.log("adaptivePredict decision " + decision + " exec LA(1)==" + this.getLookaheadName(input) + " line " + input.LT(1).line + ":" + input.LT(1).column);
	    }
	    this._input = input;
	    this._startIndex = input.index;
	    this._outerContext = outerContext;

	    var dfa = this.decisionToDFA[decision];
	    this._dfa = dfa;
	    var m = input.mark();
	    var index = input.index;

	    // Now we are certain to have a specific decision's DFA
	    // But, do we still need an initial state?
	    try {
	        var s0;
	        if (dfa.precedenceDfa) {
	            // the start state for a precedence DFA depends on the current
	            // parser precedence, and is provided by a DFA method.
	            s0 = dfa.getPrecedenceStartState(this.parser.getPrecedence());
	        } else {
	            // the start state for a "regular" DFA is just s0
	            s0 = dfa.s0;
	        }
	        if (s0 === null) {
	            if (outerContext === null) {
	                outerContext = RuleContext.EMPTY;
	            }
	            if (this.debug || this.debug_list_atn_decisions) {
	                console.log("predictATN decision " + dfa.decision + " exec LA(1)==" + this.getLookaheadName(input) + ", outerContext=" + outerContext.toString(this.parser.ruleNames));
	            }

	            var fullCtx = false;
	            var s0_closure = this.computeStartState(dfa.atnStartState, RuleContext.EMPTY, fullCtx);

	            if (dfa.precedenceDfa) {
	                // If this is a precedence DFA, we use applyPrecedenceFilter
	                // to convert the computed start state to a precedence start
	                // state. We then use DFA.setPrecedenceStartState to set the
	                // appropriate start state for the precedence level rather
	                // than simply setting DFA.s0.
	                //
	                dfa.s0.configs = s0_closure; // not used for prediction but useful to know start configs anyway
	                s0_closure = this.applyPrecedenceFilter(s0_closure);
	                s0 = this.addDFAState(dfa, new DFAState(null, s0_closure));
	                dfa.setPrecedenceStartState(this.parser.getPrecedence(), s0);
	            } else {
	                s0 = this.addDFAState(dfa, new DFAState(null, s0_closure));
	                dfa.s0 = s0;
	            }
	        }
	        var alt = this.execATN(dfa, s0, input, index, outerContext);
	        if (this.debug) {
	            console.log("DFA after predictATN: " + dfa.toString(this.parser.literalNames));
	        }
	        return alt;
	    } finally {
	        this._dfa = null;
	        this.mergeCache = null; // wack cache after each prediction
	        input.seek(index);
	        input.release(m);
	    }
	};
	// Performs ATN simulation to compute a predicted alternative based
	//  upon the remaining input, but also updates the DFA cache to avoid
	//  having to traverse the ATN again for the same input sequence.

	// There are some key conditions we're looking for after computing a new
	// set of ATN configs (proposed DFA state):
	// if the set is empty, there is no viable alternative for current symbol
	// does the state uniquely predict an alternative?
	// does the state have a conflict that would prevent us from
	//   putting it on the work list?

	// We also have some key operations to do:
	// add an edge from previous DFA state to potentially new DFA state, D,
	//   upon current symbol but only if adding to work list, which means in all
	//   cases except no viable alternative (and possibly non-greedy decisions?)
	// collecting predicates and adding semantic context to DFA accept states
	// adding rule context to context-sensitive DFA accept states
	// consuming an input symbol
	// reporting a conflict
	// reporting an ambiguity
	// reporting a context sensitivity
	// reporting insufficient predicates

	// cover these cases:
	//    dead end
	//    single alt
	//    single alt + preds
	//    conflict
	//    conflict + preds
	//
	ParserATNSimulator.prototype.execATN = function (dfa, s0, input, startIndex, outerContext) {
	    if (this.debug || this.debug_list_atn_decisions) {
	        console.log("execATN decision " + dfa.decision + " exec LA(1)==" + this.getLookaheadName(input) + " line " + input.LT(1).line + ":" + input.LT(1).column);
	    }
	    var alt;
	    var previousD = s0;

	    if (this.debug) {
	        console.log("s0 = " + s0);
	    }
	    var t = input.LA(1);
	    while (true) {
	        // while more work
	        var D = this.getExistingTargetState(previousD, t);
	        if (D === null) {
	            D = this.computeTargetState(dfa, previousD, t);
	        }
	        if (D === ATNSimulator.ERROR) {
	            // if any configs in previous dipped into outer context, that
	            // means that input up to t actually finished entry rule
	            // at least for SLL decision. Full LL doesn't dip into outer
	            // so don't need special case.
	            // We will get an error no matter what so delay until after
	            // decision; better error message. Also, no reachable target
	            // ATN states in SLL implies LL will also get nowhere.
	            // If conflict in states that dip out, choose min since we
	            // will get error no matter what.
	            var e = this.noViableAlt(input, outerContext, previousD.configs, startIndex);
	            input.seek(startIndex);
	            alt = this.getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(previousD.configs, outerContext);
	            if (alt !== ATN.INVALID_ALT_NUMBER) {
	                return alt;
	            } else {
	                throw e;
	            }
	        }
	        if (D.requiresFullContext && this.predictionMode !== PredictionMode.SLL) {
	            // IF PREDS, MIGHT RESOLVE TO SINGLE ALT => SLL (or syntax error)
	            var conflictingAlts = null;
	            if (D.predicates !== null) {
	                if (this.debug) {
	                    console.log("DFA state has preds in DFA sim LL failover");
	                }
	                var conflictIndex = input.index;
	                if (conflictIndex !== startIndex) {
	                    input.seek(startIndex);
	                }
	                conflictingAlts = this.evalSemanticContext(D.predicates, outerContext, true);
	                if (conflictingAlts.length === 1) {
	                    if (this.debug) {
	                        console.log("Full LL avoided");
	                    }
	                    return conflictingAlts.minValue();
	                }
	                if (conflictIndex !== startIndex) {
	                    // restore the index so reporting the fallback to full
	                    // context occurs with the index at the correct spot
	                    input.seek(conflictIndex);
	                }
	            }
	            if (this.dfa_debug) {
	                console.log("ctx sensitive state " + outerContext + " in " + D);
	            }
	            var fullCtx = true;
	            var s0_closure = this.computeStartState(dfa.atnStartState, outerContext, fullCtx);
	            this.reportAttemptingFullContext(dfa, conflictingAlts, D.configs, startIndex, input.index);
	            alt = this.execATNWithFullContext(dfa, D, s0_closure, input, startIndex, outerContext);
	            return alt;
	        }
	        if (D.isAcceptState) {
	            if (D.predicates === null) {
	                return D.prediction;
	            }
	            var stopIndex = input.index;
	            input.seek(startIndex);
	            var alts = this.evalSemanticContext(D.predicates, outerContext, true);
	            if (alts.length === 0) {
	                throw this.noViableAlt(input, outerContext, D.configs, startIndex);
	            } else if (alts.length === 1) {
	                return alts.minValue();
	            } else {
	                // report ambiguity after predicate evaluation to make sure the correct set of ambig alts is reported.
	                this.reportAmbiguity(dfa, D, startIndex, stopIndex, false, alts, D.configs);
	                return alts.minValue();
	            }
	        }
	        previousD = D;

	        if (t !== Token.EOF) {
	            input.consume();
	            t = input.LA(1);
	        }
	    }
	};
	//
	// Get an existing target state for an edge in the DFA. If the target state
	// for the edge has not yet been computed or is otherwise not available,
	// this method returns {@code null}.
	//
	// @param previousD The current DFA state
	// @param t The next input symbol
	// @return The existing target DFA state for the given input symbol
	// {@code t}, or {@code null} if the target state for this edge is not
	// already cached
	//
	ParserATNSimulator.prototype.getExistingTargetState = function (previousD, t) {
	    var edges = previousD.edges;
	    if (edges === null) {
	        return null;
	    } else {
	        return edges[t + 1] || null;
	    }
	};
	//
	// Compute a target state for an edge in the DFA, and attempt to add the
	// computed state and corresponding edge to the DFA.
	//
	// @param dfa The DFA
	// @param previousD The current DFA state
	// @param t The next input symbol
	//
	// @return The computed target DFA state for the given input symbol
	// {@code t}. If {@code t} does not lead to a valid DFA state, this method
	// returns {@link //ERROR}.
	//
	ParserATNSimulator.prototype.computeTargetState = function (dfa, previousD, t) {
	    var reach = this.computeReachSet(previousD.configs, t, false);
	    if (reach === null) {
	        this.addDFAEdge(dfa, previousD, t, ATNSimulator.ERROR);
	        return ATNSimulator.ERROR;
	    }
	    // create new target state; we'll add to DFA after it's complete
	    var D = new DFAState(null, reach);

	    var predictedAlt = this.getUniqueAlt(reach);

	    if (this.debug) {
	        var altSubSets = PredictionMode.getConflictingAltSubsets(reach);
	        console.log("SLL altSubSets=" + Utils.arrayToString(altSubSets) + ", previous=" + previousD.configs + ", configs=" + reach + ", predict=" + predictedAlt + ", allSubsetsConflict=" + PredictionMode.allSubsetsConflict(altSubSets) + ", conflictingAlts=" + this.getConflictingAlts(reach));
	    }
	    if (predictedAlt !== ATN.INVALID_ALT_NUMBER) {
	        // NO CONFLICT, UNIQUELY PREDICTED ALT
	        D.isAcceptState = true;
	        D.configs.uniqueAlt = predictedAlt;
	        D.prediction = predictedAlt;
	    } else if (PredictionMode.hasSLLConflictTerminatingPrediction(this.predictionMode, reach)) {
	        // MORE THAN ONE VIABLE ALTERNATIVE
	        D.configs.conflictingAlts = this.getConflictingAlts(reach);
	        D.requiresFullContext = true;
	        // in SLL-only mode, we will stop at this state and return the minimum alt
	        D.isAcceptState = true;
	        D.prediction = D.configs.conflictingAlts.minValue();
	    }
	    if (D.isAcceptState && D.configs.hasSemanticContext) {
	        this.predicateDFAState(D, this.atn.getDecisionState(dfa.decision));
	        if (D.predicates !== null) {
	            D.prediction = ATN.INVALID_ALT_NUMBER;
	        }
	    }
	    // all adds to dfa are done after we've created full D state
	    D = this.addDFAEdge(dfa, previousD, t, D);
	    return D;
	};

	ParserATNSimulator.prototype.predicateDFAState = function (dfaState, decisionState) {
	    // We need to test all predicates, even in DFA states that
	    // uniquely predict alternative.
	    var nalts = decisionState.transitions.length;
	    // Update DFA so reach becomes accept state with (predicate,alt)
	    // pairs if preds found for conflicting alts
	    var altsToCollectPredsFrom = this.getConflictingAltsOrUniqueAlt(dfaState.configs);
	    var altToPred = this.getPredsForAmbigAlts(altsToCollectPredsFrom, dfaState.configs, nalts);
	    if (altToPred !== null) {
	        dfaState.predicates = this.getPredicatePredictions(altsToCollectPredsFrom, altToPred);
	        dfaState.prediction = ATN.INVALID_ALT_NUMBER; // make sure we use preds
	    } else {
	        // There are preds in configs but they might go away
	        // when OR'd together like {p}? || NONE == NONE. If neither
	        // alt has preds, resolve to min alt
	        dfaState.prediction = altsToCollectPredsFrom.minValue();
	    }
	};

	// comes back with reach.uniqueAlt set to a valid alt
	ParserATNSimulator.prototype.execATNWithFullContext = function (dfa, D, // how far we got before failing over
	s0, input, startIndex, outerContext) {
	    if (this.debug || this.debug_list_atn_decisions) {
	        console.log("execATNWithFullContext " + s0);
	    }
	    var fullCtx = true;
	    var foundExactAmbig = false;
	    var reach = null;
	    var previous = s0;
	    input.seek(startIndex);
	    var t = input.LA(1);
	    var predictedAlt = -1;
	    while (true) {
	        // while more work
	        reach = this.computeReachSet(previous, t, fullCtx);
	        if (reach === null) {
	            // if any configs in previous dipped into outer context, that
	            // means that input up to t actually finished entry rule
	            // at least for LL decision. Full LL doesn't dip into outer
	            // so don't need special case.
	            // We will get an error no matter what so delay until after
	            // decision; better error message. Also, no reachable target
	            // ATN states in SLL implies LL will also get nowhere.
	            // If conflict in states that dip out, choose min since we
	            // will get error no matter what.
	            var e = this.noViableAlt(input, outerContext, previous, startIndex);
	            input.seek(startIndex);
	            var alt = this.getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule(previous, outerContext);
	            if (alt !== ATN.INVALID_ALT_NUMBER) {
	                return alt;
	            } else {
	                throw e;
	            }
	        }
	        var altSubSets = PredictionMode.getConflictingAltSubsets(reach);
	        if (this.debug) {
	            console.log("LL altSubSets=" + altSubSets + ", predict=" + PredictionMode.getUniqueAlt(altSubSets) + ", resolvesToJustOneViableAlt=" + PredictionMode.resolvesToJustOneViableAlt(altSubSets));
	        }
	        reach.uniqueAlt = this.getUniqueAlt(reach);
	        // unique prediction?
	        if (reach.uniqueAlt !== ATN.INVALID_ALT_NUMBER) {
	            predictedAlt = reach.uniqueAlt;
	            break;
	        } else if (this.predictionMode !== PredictionMode.LL_EXACT_AMBIG_DETECTION) {
	            predictedAlt = PredictionMode.resolvesToJustOneViableAlt(altSubSets);
	            if (predictedAlt !== ATN.INVALID_ALT_NUMBER) {
	                break;
	            }
	        } else {
	            // In exact ambiguity mode, we never try to terminate early.
	            // Just keeps scarfing until we know what the conflict is
	            if (PredictionMode.allSubsetsConflict(altSubSets) && PredictionMode.allSubsetsEqual(altSubSets)) {
	                foundExactAmbig = true;
	                predictedAlt = PredictionMode.getSingleViableAlt(altSubSets);
	                break;
	            }
	            // else there are multiple non-conflicting subsets or
	            // we're not sure what the ambiguity is yet.
	            // So, keep going.
	        }
	        previous = reach;
	        if (t !== Token.EOF) {
	            input.consume();
	            t = input.LA(1);
	        }
	    }
	    // If the configuration set uniquely predicts an alternative,
	    // without conflict, then we know that it's a full LL decision
	    // not SLL.
	    if (reach.uniqueAlt !== ATN.INVALID_ALT_NUMBER) {
	        this.reportContextSensitivity(dfa, predictedAlt, reach, startIndex, input.index);
	        return predictedAlt;
	    }
	    // We do not check predicates here because we have checked them
	    // on-the-fly when doing full context prediction.

	    //
	    // In non-exact ambiguity detection mode, we might	actually be able to
	    // detect an exact ambiguity, but I'm not going to spend the cycles
	    // needed to check. We only emit ambiguity warnings in exact ambiguity
	    // mode.
	    //
	    // For example, we might know that we have conflicting configurations.
	    // But, that does not mean that there is no way forward without a
	    // conflict. It's possible to have nonconflicting alt subsets as in:

	    // altSubSets=[{1, 2}, {1, 2}, {1}, {1, 2}]

	    // from
	    //
	    //    [(17,1,[5 $]), (13,1,[5 10 $]), (21,1,[5 10 $]), (11,1,[$]),
	    //     (13,2,[5 10 $]), (21,2,[5 10 $]), (11,2,[$])]
	    //
	    // In this case, (17,1,[5 $]) indicates there is some next sequence that
	    // would resolve this without conflict to alternative 1. Any other viable
	    // next sequence, however, is associated with a conflict.  We stop
	    // looking for input because no amount of further lookahead will alter
	    // the fact that we should predict alternative 1.  We just can't say for
	    // sure that there is an ambiguity without looking further.

	    this.reportAmbiguity(dfa, D, startIndex, input.index, foundExactAmbig, null, reach);

	    return predictedAlt;
	};

	ParserATNSimulator.prototype.computeReachSet = function (closure, t, fullCtx) {
	    if (this.debug) {
	        console.log("in computeReachSet, starting closure: " + closure);
	    }
	    if (this.mergeCache === null) {
	        this.mergeCache = new DoubleDict();
	    }
	    var intermediate = new ATNConfigSet(fullCtx);

	    // Configurations already in a rule stop state indicate reaching the end
	    // of the decision rule (local context) or end of the start rule (full
	    // context). Once reached, these configurations are never updated by a
	    // closure operation, so they are handled separately for the performance
	    // advantage of having a smaller intermediate set when calling closure.
	    //
	    // For full-context reach operations, separate handling is required to
	    // ensure that the alternative matching the longest overall sequence is
	    // chosen when multiple such configurations can match the input.

	    var skippedStopStates = null;

	    // First figure out where we can reach on input t
	    for (var i = 0; i < closure.items.length; i++) {
	        var c = closure.items[i];
	        if (this.debug_add) {
	            console.log("testing " + this.getTokenName(t) + " at " + c);
	        }
	        if (c.state instanceof RuleStopState) {
	            if (fullCtx || t === Token.EOF) {
	                if (skippedStopStates === null) {
	                    skippedStopStates = [];
	                }
	                skippedStopStates.push(c);
	                if (this.debug_add) {
	                    console.log("added " + c + " to skippedStopStates");
	                }
	            }
	            continue;
	        }
	        for (var j = 0; j < c.state.transitions.length; j++) {
	            var trans = c.state.transitions[j];
	            var target = this.getReachableTarget(trans, t);
	            if (target !== null) {
	                var cfg = new ATNConfig({ state: target }, c);
	                intermediate.add(cfg, this.mergeCache);
	                if (this.debug_add) {
	                    console.log("added " + cfg + " to intermediate");
	                }
	            }
	        }
	    }
	    // Now figure out where the reach operation can take us...
	    var reach = null;

	    // This block optimizes the reach operation for intermediate sets which
	    // trivially indicate a termination state for the overall
	    // adaptivePredict operation.
	    //
	    // The conditions assume that intermediate
	    // contains all configurations relevant to the reach set, but this
	    // condition is not true when one or more configurations have been
	    // withheld in skippedStopStates, or when the current symbol is EOF.
	    //
	    if (skippedStopStates === null && t !== Token.EOF) {
	        if (intermediate.items.length === 1) {
	            // Don't pursue the closure if there is just one state.
	            // It can only have one alternative; just add to result
	            // Also don't pursue the closure if there is unique alternative
	            // among the configurations.
	            reach = intermediate;
	        } else if (this.getUniqueAlt(intermediate) !== ATN.INVALID_ALT_NUMBER) {
	            // Also don't pursue the closure if there is unique alternative
	            // among the configurations.
	            reach = intermediate;
	        }
	    }
	    // If the reach set could not be trivially determined, perform a closure
	    // operation on the intermediate set to compute its initial value.
	    //
	    if (reach === null) {
	        reach = new ATNConfigSet(fullCtx);
	        var closureBusy = new Set();
	        var treatEofAsEpsilon = t === Token.EOF;
	        for (var k = 0; k < intermediate.items.length; k++) {
	            this.closure(intermediate.items[k], reach, closureBusy, false, fullCtx, treatEofAsEpsilon);
	        }
	    }
	    if (t === Token.EOF) {
	        // After consuming EOF no additional input is possible, so we are
	        // only interested in configurations which reached the end of the
	        // decision rule (local context) or end of the start rule (full
	        // context). Update reach to contain only these configurations. This
	        // handles both explicit EOF transitions in the grammar and implicit
	        // EOF transitions following the end of the decision or start rule.
	        //
	        // When reach==intermediate, no closure operation was performed. In
	        // this case, removeAllConfigsNotInRuleStopState needs to check for
	        // reachable rule stop states as well as configurations already in
	        // a rule stop state.
	        //
	        // This is handled before the configurations in skippedStopStates,
	        // because any configurations potentially added from that list are
	        // already guaranteed to meet this condition whether or not it's
	        // required.
	        //
	        reach = this.removeAllConfigsNotInRuleStopState(reach, reach === intermediate);
	    }
	    // If skippedStopStates!==null, then it contains at least one
	    // configuration. For full-context reach operations, these
	    // configurations reached the end of the start rule, in which case we
	    // only add them back to reach if no configuration during the current
	    // closure operation reached such a state. This ensures adaptivePredict
	    // chooses an alternative matching the longest overall sequence when
	    // multiple alternatives are viable.
	    //
	    if (skippedStopStates !== null && (!fullCtx || !PredictionMode.hasConfigInRuleStopState(reach))) {
	        for (var l = 0; l < skippedStopStates.length; l++) {
	            reach.add(skippedStopStates[l], this.mergeCache);
	        }
	    }
	    if (reach.items.length === 0) {
	        return null;
	    } else {
	        return reach;
	    }
	};
	//
	// Return a configuration set containing only the configurations from
	// {@code configs} which are in a {@link RuleStopState}. If all
	// configurations in {@code configs} are already in a rule stop state, this
	// method simply returns {@code configs}.
	//
	// <p>When {@code lookToEndOfRule} is true, this method uses
	// {@link ATN//nextTokens} for each configuration in {@code configs} which is
	// not already in a rule stop state to see if a rule stop state is reachable
	// from the configuration via epsilon-only transitions.</p>
	//
	// @param configs the configuration set to update
	// @param lookToEndOfRule when true, this method checks for rule stop states
	// reachable by epsilon-only transitions from each configuration in
	// {@code configs}.
	//
	// @return {@code configs} if all configurations in {@code configs} are in a
	// rule stop state, otherwise return a new configuration set containing only
	// the configurations from {@code configs} which are in a rule stop state
	//
	ParserATNSimulator.prototype.removeAllConfigsNotInRuleStopState = function (configs, lookToEndOfRule) {
	    if (PredictionMode.allConfigsInRuleStopStates(configs)) {
	        return configs;
	    }
	    var result = new ATNConfigSet(configs.fullCtx);
	    for (var i = 0; i < configs.items.length; i++) {
	        var config = configs.items[i];
	        if (config.state instanceof RuleStopState) {
	            result.add(config, this.mergeCache);
	            continue;
	        }
	        if (lookToEndOfRule && config.state.epsilonOnlyTransitions) {
	            var nextTokens = this.atn.nextTokens(config.state);
	            if (nextTokens.contains(Token.EPSILON)) {
	                var endOfRuleState = this.atn.ruleToStopState[config.state.ruleIndex];
	                result.add(new ATNConfig({ state: endOfRuleState }, config), this.mergeCache);
	            }
	        }
	    }
	    return result;
	};

	ParserATNSimulator.prototype.computeStartState = function (p, ctx, fullCtx) {
	    // always at least the implicit call to start rule
	    var initialContext = predictionContextFromRuleContext(this.atn, ctx);
	    var configs = new ATNConfigSet(fullCtx);
	    for (var i = 0; i < p.transitions.length; i++) {
	        var target = p.transitions[i].target;
	        var c = new ATNConfig({ state: target, alt: i + 1, context: initialContext }, null);
	        var closureBusy = new Set();
	        this.closure(c, configs, closureBusy, true, fullCtx, false);
	    }
	    return configs;
	};

	//
	// This method transforms the start state computed by
	// {@link //computeStartState} to the special start state used by a
	// precedence DFA for a particular precedence value. The transformation
	// process applies the following changes to the start state's configuration
	// set.
	//
	// <ol>
	// <li>Evaluate the precedence predicates for each configuration using
	// {@link SemanticContext//evalPrecedence}.</li>
	// <li>Remove all configurations which predict an alternative greater than
	// 1, for which another configuration that predicts alternative 1 is in the
	// same ATN state with the same prediction context. This transformation is
	// valid for the following reasons:
	// <ul>
	// <li>The closure block cannot contain any epsilon transitions which bypass
	// the body of the closure, so all states reachable via alternative 1 are
	// part of the precedence alternatives of the transformed left-recursive
	// rule.</li>
	// <li>The "primary" portion of a left recursive rule cannot contain an
	// epsilon transition, so the only way an alternative other than 1 can exist
	// in a state that is also reachable via alternative 1 is by nesting calls
	// to the left-recursive rule, with the outer calls not being at the
	// preferred precedence level.</li>
	// </ul>
	// </li>
	// </ol>
	//
	// <p>
	// The prediction context must be considered by this filter to address
	// situations like the following.
	// </p>
	// <code>
	// <pre>
	// grammar TA;
	// prog: statement* EOF;
	// statement: letterA | statement letterA 'b' ;
	// letterA: 'a';
	// </pre>
	// </code>
	// <p>
	// If the above grammar, the ATN state immediately before the token
	// reference {@code 'a'} in {@code letterA} is reachable from the left edge
	// of both the primary and closure blocks of the left-recursive rule
	// {@code statement}. The prediction context associated with each of these
	// configurations distinguishes between them, and prevents the alternative
	// which stepped out to {@code prog} (and then back in to {@code statement}
	// from being eliminated by the filter.
	// </p>
	//
	// @param configs The configuration set computed by
	// {@link //computeStartState} as the start state for the DFA.
	// @return The transformed configuration set representing the start state
	// for a precedence DFA at a particular precedence level (determined by
	// calling {@link Parser//getPrecedence}).
	//
	ParserATNSimulator.prototype.applyPrecedenceFilter = function (configs) {
	    var config;
	    var statesFromAlt1 = [];
	    var configSet = new ATNConfigSet(configs.fullCtx);
	    for (var i = 0; i < configs.items.length; i++) {
	        config = configs.items[i];
	        // handle alt 1 first
	        if (config.alt !== 1) {
	            continue;
	        }
	        var updatedContext = config.semanticContext.evalPrecedence(this.parser, this._outerContext);
	        if (updatedContext === null) {
	            // the configuration was eliminated
	            continue;
	        }
	        statesFromAlt1[config.state.stateNumber] = config.context;
	        if (updatedContext !== config.semanticContext) {
	            configSet.add(new ATNConfig({ semanticContext: updatedContext }, config), this.mergeCache);
	        } else {
	            configSet.add(config, this.mergeCache);
	        }
	    }
	    for (i = 0; i < configs.items.length; i++) {
	        config = configs.items[i];
	        if (config.alt === 1) {
	            // already handled
	            continue;
	        }
	        // In the future, this elimination step could be updated to also
	        // filter the prediction context for alternatives predicting alt>1
	        // (basically a graph subtraction algorithm).
	        if (!config.precedenceFilterSuppressed) {
	            var context = statesFromAlt1[config.state.stateNumber] || null;
	            if (context !== null && context.equals(config.context)) {
	                // eliminated
	                continue;
	            }
	        }
	        configSet.add(config, this.mergeCache);
	    }
	    return configSet;
	};

	ParserATNSimulator.prototype.getReachableTarget = function (trans, ttype) {
	    if (trans.matches(ttype, 0, this.atn.maxTokenType)) {
	        return trans.target;
	    } else {
	        return null;
	    }
	};

	ParserATNSimulator.prototype.getPredsForAmbigAlts = function (ambigAlts, configs, nalts) {
	    // REACH=[1|1|[]|0:0, 1|2|[]|0:1]
	    // altToPred starts as an array of all null contexts. The entry at index i
	    // corresponds to alternative i. altToPred[i] may have one of three values:
	    //   1. null: no ATNConfig c is found such that c.alt==i
	    //   2. SemanticContext.NONE: At least one ATNConfig c exists such that
	    //      c.alt==i and c.semanticContext==SemanticContext.NONE. In other words,
	    //      alt i has at least one unpredicated config.
	    //   3. Non-NONE Semantic Context: There exists at least one, and for all
	    //      ATNConfig c such that c.alt==i, c.semanticContext!=SemanticContext.NONE.
	    //
	    // From this, it is clear that NONE||anything==NONE.
	    //
	    var altToPred = [];
	    for (var i = 0; i < configs.items.length; i++) {
	        var c = configs.items[i];
	        if (ambigAlts.contains(c.alt)) {
	            altToPred[c.alt] = SemanticContext.orContext(altToPred[c.alt] || null, c.semanticContext);
	        }
	    }
	    var nPredAlts = 0;
	    for (i = 1; i < nalts + 1; i++) {
	        var pred = altToPred[i] || null;
	        if (pred === null) {
	            altToPred[i] = SemanticContext.NONE;
	        } else if (pred !== SemanticContext.NONE) {
	            nPredAlts += 1;
	        }
	    }
	    // nonambig alts are null in altToPred
	    if (nPredAlts === 0) {
	        altToPred = null;
	    }
	    if (this.debug) {
	        console.log("getPredsForAmbigAlts result " + Utils.arrayToString(altToPred));
	    }
	    return altToPred;
	};

	ParserATNSimulator.prototype.getPredicatePredictions = function (ambigAlts, altToPred) {
	    var pairs = [];
	    var containsPredicate = false;
	    for (var i = 1; i < altToPred.length; i++) {
	        var pred = altToPred[i];
	        // unpredicated is indicated by SemanticContext.NONE
	        if (ambigAlts !== null && ambigAlts.contains(i)) {
	            pairs.push(new PredPrediction(pred, i));
	        }
	        if (pred !== SemanticContext.NONE) {
	            containsPredicate = true;
	        }
	    }
	    if (!containsPredicate) {
	        return null;
	    }
	    return pairs;
	};

	//
	// This method is used to improve the localization of error messages by
	// choosing an alternative rather than throwing a
	// {@link NoViableAltException} in particular prediction scenarios where the
	// {@link //ERROR} state was reached during ATN simulation.
	//
	// <p>
	// The default implementation of this method uses the following
	// algorithm to identify an ATN configuration which successfully parsed the
	// decision entry rule. Choosing such an alternative ensures that the
	// {@link ParserRuleContext} returned by the calling rule will be complete
	// and valid, and the syntax error will be reported later at a more
	// localized location.</p>
	//
	// <ul>
	// <li>If a syntactically valid path or paths reach the end of the decision rule and
	// they are semantically valid if predicated, return the min associated alt.</li>
	// <li>Else, if a semantically invalid but syntactically valid path exist
	// or paths exist, return the minimum associated alt.
	// </li>
	// <li>Otherwise, return {@link ATN//INVALID_ALT_NUMBER}.</li>
	// </ul>
	//
	// <p>
	// In some scenarios, the algorithm described above could predict an
	// alternative which will result in a {@link FailedPredicateException} in
	// the parser. Specifically, this could occur if the <em>only</em> configuration
	// capable of successfully parsing to the end of the decision rule is
	// blocked by a semantic predicate. By choosing this alternative within
	// {@link //adaptivePredict} instead of throwing a
	// {@link NoViableAltException}, the resulting
	// {@link FailedPredicateException} in the parser will identify the specific
	// predicate which is preventing the parser from successfully parsing the
	// decision rule, which helps developers identify and correct logic errors
	// in semantic predicates.
	// </p>
	//
	// @param configs The ATN configurations which were valid immediately before
	// the {@link //ERROR} state was reached
	// @param outerContext The is the \gamma_0 initial parser context from the paper
	// or the parser stack at the instant before prediction commences.
	//
	// @return The value to return from {@link //adaptivePredict}, or
	// {@link ATN//INVALID_ALT_NUMBER} if a suitable alternative was not
	// identified and {@link //adaptivePredict} should report an error instead.
	//
	ParserATNSimulator.prototype.getSynValidOrSemInvalidAltThatFinishedDecisionEntryRule = function (configs, outerContext) {
	    var cfgs = this.splitAccordingToSemanticValidity(configs, outerContext);
	    var semValidConfigs = cfgs[0];
	    var semInvalidConfigs = cfgs[1];
	    var alt = this.getAltThatFinishedDecisionEntryRule(semValidConfigs);
	    if (alt !== ATN.INVALID_ALT_NUMBER) {
	        // semantically/syntactically viable path exists
	        return alt;
	    }
	    // Is there a syntactically valid path with a failed pred?
	    if (semInvalidConfigs.items.length > 0) {
	        alt = this.getAltThatFinishedDecisionEntryRule(semInvalidConfigs);
	        if (alt !== ATN.INVALID_ALT_NUMBER) {
	            // syntactically viable path exists
	            return alt;
	        }
	    }
	    return ATN.INVALID_ALT_NUMBER;
	};

	ParserATNSimulator.prototype.getAltThatFinishedDecisionEntryRule = function (configs) {
	    var alts = [];
	    for (var i = 0; i < configs.items.length; i++) {
	        var c = configs.items[i];
	        if (c.reachesIntoOuterContext > 0 || c.state instanceof RuleStopState && c.context.hasEmptyPath()) {
	            if (alts.indexOf(c.alt) < 0) {
	                alts.push(c.alt);
	            }
	        }
	    }
	    if (alts.length === 0) {
	        return ATN.INVALID_ALT_NUMBER;
	    } else {
	        return Math.min.apply(null, alts);
	    }
	};
	// Walk the list of configurations and split them according to
	//  those that have preds evaluating to true/false.  If no pred, assume
	//  true pred and include in succeeded set.  Returns Pair of sets.
	//
	//  Create a new set so as not to alter the incoming parameter.
	//
	//  Assumption: the input stream has been restored to the starting point
	//  prediction, which is where predicates need to evaluate.
	//
	ParserATNSimulator.prototype.splitAccordingToSemanticValidity = function (configs, outerContext) {
	    var succeeded = new ATNConfigSet(configs.fullCtx);
	    var failed = new ATNConfigSet(configs.fullCtx);
	    for (var i = 0; i < configs.items.length; i++) {
	        var c = configs.items[i];
	        if (c.semanticContext !== SemanticContext.NONE) {
	            var predicateEvaluationResult = c.semanticContext.evaluate(this.parser, outerContext);
	            if (predicateEvaluationResult) {
	                succeeded.add(c);
	            } else {
	                failed.add(c);
	            }
	        } else {
	            succeeded.add(c);
	        }
	    }
	    return [succeeded, failed];
	};

	// Look through a list of predicate/alt pairs, returning alts for the
	//  pairs that win. A {@code NONE} predicate indicates an alt containing an
	//  unpredicated config which behaves as "always true." If !complete
	//  then we stop at the first predicate that evaluates to true. This
	//  includes pairs with null predicates.
	//
	ParserATNSimulator.prototype.evalSemanticContext = function (predPredictions, outerContext, complete) {
	    var predictions = new BitSet();
	    for (var i = 0; i < predPredictions.length; i++) {
	        var pair = predPredictions[i];
	        if (pair.pred === SemanticContext.NONE) {
	            predictions.add(pair.alt);
	            if (!complete) {
	                break;
	            }
	            continue;
	        }
	        var predicateEvaluationResult = pair.pred.evaluate(this.parser, outerContext);
	        if (this.debug || this.dfa_debug) {
	            console.log("eval pred " + pair + "=" + predicateEvaluationResult);
	        }
	        if (predicateEvaluationResult) {
	            if (this.debug || this.dfa_debug) {
	                console.log("PREDICT " + pair.alt);
	            }
	            predictions.add(pair.alt);
	            if (!complete) {
	                break;
	            }
	        }
	    }
	    return predictions;
	};

	// TODO: If we are doing predicates, there is no point in pursuing
	//     closure operations if we reach a DFA state that uniquely predicts
	//     alternative. We will not be caching that DFA state and it is a
	//     waste to pursue the closure. Might have to advance when we do
	//     ambig detection thought :(
	//

	ParserATNSimulator.prototype.closure = function (config, configs, closureBusy, collectPredicates, fullCtx, treatEofAsEpsilon) {
	    var initialDepth = 0;
	    this.closureCheckingStopState(config, configs, closureBusy, collectPredicates, fullCtx, initialDepth, treatEofAsEpsilon);
	};

	ParserATNSimulator.prototype.closureCheckingStopState = function (config, configs, closureBusy, collectPredicates, fullCtx, depth, treatEofAsEpsilon) {
	    if (this.debug || this.debug_closure) {
	        console.log("closure(" + config.toString(this.parser, true) + ")");
	        // console.log("configs(" + configs.toString() + ")");
	        if (config.reachesIntoOuterContext > 50) {
	            throw "problem";
	        }
	    }
	    if (config.state instanceof RuleStopState) {
	        // We hit rule end. If we have context info, use it
	        // run thru all possible stack tops in ctx
	        if (!config.context.isEmpty()) {
	            for (var i = 0; i < config.context.length; i++) {
	                if (config.context.getReturnState(i) === PredictionContext.EMPTY_RETURN_STATE) {
	                    if (fullCtx) {
	                        configs.add(new ATNConfig({ state: config.state, context: PredictionContext.EMPTY }, config), this.mergeCache);
	                        continue;
	                    } else {
	                        // we have no context info, just chase follow links (if greedy)
	                        if (this.debug) {
	                            console.log("FALLING off rule " + this.getRuleName(config.state.ruleIndex));
	                        }
	                        this.closure_(config, configs, closureBusy, collectPredicates, fullCtx, depth, treatEofAsEpsilon);
	                    }
	                    continue;
	                }
	                var returnState = this.atn.states[config.context.getReturnState(i)];
	                var newContext = config.context.getParent(i); // "pop" return state
	                var parms = { state: returnState, alt: config.alt, context: newContext, semanticContext: config.semanticContext };
	                var c = new ATNConfig(parms, null);
	                // While we have context to pop back from, we may have
	                // gotten that context AFTER having falling off a rule.
	                // Make sure we track that we are now out of context.
	                c.reachesIntoOuterContext = config.reachesIntoOuterContext;
	                this.closureCheckingStopState(c, configs, closureBusy, collectPredicates, fullCtx, depth - 1, treatEofAsEpsilon);
	            }
	            return;
	        } else if (fullCtx) {
	            // reached end of start rule
	            configs.add(config, this.mergeCache);
	            return;
	        } else {
	            // else if we have no context info, just chase follow links (if greedy)
	            if (this.debug) {
	                console.log("FALLING off rule " + this.getRuleName(config.state.ruleIndex));
	            }
	        }
	    }
	    this.closure_(config, configs, closureBusy, collectPredicates, fullCtx, depth, treatEofAsEpsilon);
	};

	// Do the actual work of walking epsilon edges//
	ParserATNSimulator.prototype.closure_ = function (config, configs, closureBusy, collectPredicates, fullCtx, depth, treatEofAsEpsilon) {
	    var p = config.state;
	    // optimization
	    if (!p.epsilonOnlyTransitions) {
	        configs.add(config, this.mergeCache);
	        // make sure to not return here, because EOF transitions can act as
	        // both epsilon transitions and non-epsilon transitions.
	    }
	    for (var i = 0; i < p.transitions.length; i++) {
	        if (i == 0 && this.canDropLoopEntryEdgeInLeftRecursiveRule(config)) continue;

	        var t = p.transitions[i];
	        var continueCollecting = collectPredicates && !(t instanceof ActionTransition);
	        var c = this.getEpsilonTarget(config, t, continueCollecting, depth === 0, fullCtx, treatEofAsEpsilon);
	        if (c !== null) {
	            if (!t.isEpsilon && closureBusy.add(c) !== c) {
	                // avoid infinite recursion for EOF* and EOF+
	                continue;
	            }
	            var newDepth = depth;
	            if (config.state instanceof RuleStopState) {
	                // target fell off end of rule; mark resulting c as having dipped into outer context
	                // We can't get here if incoming config was rule stop and we had context
	                // track how far we dip into outer context.  Might
	                // come in handy and we avoid evaluating context dependent
	                // preds if this is > 0.

	                if (closureBusy.add(c) !== c) {
	                    // avoid infinite recursion for right-recursive rules
	                    continue;
	                }

	                if (this._dfa !== null && this._dfa.precedenceDfa) {
	                    if (t.outermostPrecedenceReturn === this._dfa.atnStartState.ruleIndex) {
	                        c.precedenceFilterSuppressed = true;
	                    }
	                }

	                c.reachesIntoOuterContext += 1;
	                configs.dipsIntoOuterContext = true; // TODO: can remove? only care when we add to set per middle of this method
	                newDepth -= 1;
	                if (this.debug) {
	                    console.log("dips into outer ctx: " + c);
	                }
	            } else if (t instanceof RuleTransition) {
	                // latch when newDepth goes negative - once we step out of the entry context we can't return
	                if (newDepth >= 0) {
	                    newDepth += 1;
	                }
	            }
	            this.closureCheckingStopState(c, configs, closureBusy, continueCollecting, fullCtx, newDepth, treatEofAsEpsilon);
	        }
	    }
	};

	ParserATNSimulator.prototype.canDropLoopEntryEdgeInLeftRecursiveRule = function (config) {
	    // return False
	    var p = config.state;
	    // First check to see if we are in StarLoopEntryState generated during
	    // left-recursion elimination. For efficiency, also check if
	    // the context has an empty stack case. If so, it would mean
	    // global FOLLOW so we can't perform optimization
	    // Are we the special loop entry/exit state? or SLL wildcard
	    if (p.stateType != ATNState.STAR_LOOP_ENTRY) return false;
	    if (p.stateType != ATNState.STAR_LOOP_ENTRY || !p.isPrecedenceDecision || config.context.isEmpty() || config.context.hasEmptyPath()) return false;

	    // Require all return states to return back to the same rule that p is in.
	    var numCtxs = config.context.length;
	    for (var i = 0; i < numCtxs; i++) {
	        // for each stack context
	        var returnState = this.atn.states[config.context.getReturnState(i)];
	        if (returnState.ruleIndex != p.ruleIndex) return false;
	    }

	    var decisionStartState = p.transitions[0].target;
	    var blockEndStateNum = decisionStartState.endState.stateNumber;
	    var blockEndState = this.atn.states[blockEndStateNum];

	    // Verify that the top of each stack context leads to loop entry/exit
	    // state through epsilon edges and w/o leaving rule.
	    for (var i = 0; i < numCtxs; i++) {
	        // for each stack context
	        var returnStateNumber = config.context.getReturnState(i);
	        var returnState = this.atn.states[returnStateNumber];
	        // all states must have single outgoing epsilon edge
	        if (returnState.transitions.length != 1 || !returnState.transitions[0].isEpsilon) return false;

	        // Look for prefix op case like 'not expr', (' type ')' expr
	        var returnStateTarget = returnState.transitions[0].target;
	        if (returnState.stateType == ATNState.BLOCK_END && returnStateTarget == p) continue;

	        // Look for 'expr op expr' or case where expr's return state is block end
	        // of (...)* internal block; the block end points to loop back
	        // which points to p but we don't need to check that
	        if (returnState == blockEndState) continue;

	        // Look for ternary expr ? expr : expr. The return state points at block end,
	        // which points at loop entry state
	        if (returnStateTarget == blockEndState) continue;

	        // Look for complex prefix 'between expr and expr' case where 2nd expr's
	        // return state points at block end state of (...)* internal block
	        if (returnStateTarget.stateType == ATNState.BLOCK_END && returnStateTarget.transitions.length == 1 && returnStateTarget.transitions[0].isEpsilon && returnStateTarget.transitions[0].target == p) continue;

	        // anything else ain't conforming
	        return false;
	    }
	    return true;
	};

	ParserATNSimulator.prototype.getRuleName = function (index) {
	    if (this.parser !== null && index >= 0) {
	        return this.parser.ruleNames[index];
	    } else {
	        return "<rule " + index + ">";
	    }
	};

	ParserATNSimulator.prototype.getEpsilonTarget = function (config, t, collectPredicates, inContext, fullCtx, treatEofAsEpsilon) {
	    switch (t.serializationType) {
	        case Transition.RULE:
	            return this.ruleTransition(config, t);
	        case Transition.PRECEDENCE:
	            return this.precedenceTransition(config, t, collectPredicates, inContext, fullCtx);
	        case Transition.PREDICATE:
	            return this.predTransition(config, t, collectPredicates, inContext, fullCtx);
	        case Transition.ACTION:
	            return this.actionTransition(config, t);
	        case Transition.EPSILON:
	            return new ATNConfig({ state: t.target }, config);
	        case Transition.ATOM:
	        case Transition.RANGE:
	        case Transition.SET:
	            // EOF transitions act like epsilon transitions after the first EOF
	            // transition is traversed
	            if (treatEofAsEpsilon) {
	                if (t.matches(Token.EOF, 0, 1)) {
	                    return new ATNConfig({ state: t.target }, config);
	                }
	            }
	            return null;
	        default:
	            return null;
	    }
	};

	ParserATNSimulator.prototype.actionTransition = function (config, t) {
	    if (this.debug) {
	        var index = t.actionIndex == -1 ? 65535 : t.actionIndex;
	        console.log("ACTION edge " + t.ruleIndex + ":" + index);
	    }
	    return new ATNConfig({ state: t.target }, config);
	};

	ParserATNSimulator.prototype.precedenceTransition = function (config, pt, collectPredicates, inContext, fullCtx) {
	    if (this.debug) {
	        console.log("PRED (collectPredicates=" + collectPredicates + ") " + pt.precedence + ">=_p, ctx dependent=true");
	        if (this.parser !== null) {
	            console.log("context surrounding pred is " + Utils.arrayToString(this.parser.getRuleInvocationStack()));
	        }
	    }
	    var c = null;
	    if (collectPredicates && inContext) {
	        if (fullCtx) {
	            // In full context mode, we can evaluate predicates on-the-fly
	            // during closure, which dramatically reduces the size of
	            // the config sets. It also obviates the need to test predicates
	            // later during conflict resolution.
	            var currentPosition = this._input.index;
	            this._input.seek(this._startIndex);
	            var predSucceeds = pt.getPredicate().evaluate(this.parser, this._outerContext);
	            this._input.seek(currentPosition);
	            if (predSucceeds) {
	                c = new ATNConfig({ state: pt.target }, config); // no pred context
	            }
	        } else {
	            var newSemCtx = SemanticContext.andContext(config.semanticContext, pt.getPredicate());
	            c = new ATNConfig({ state: pt.target, semanticContext: newSemCtx }, config);
	        }
	    } else {
	        c = new ATNConfig({ state: pt.target }, config);
	    }
	    if (this.debug) {
	        console.log("config from pred transition=" + c);
	    }
	    return c;
	};

	ParserATNSimulator.prototype.predTransition = function (config, pt, collectPredicates, inContext, fullCtx) {
	    if (this.debug) {
	        console.log("PRED (collectPredicates=" + collectPredicates + ") " + pt.ruleIndex + ":" + pt.predIndex + ", ctx dependent=" + pt.isCtxDependent);
	        if (this.parser !== null) {
	            console.log("context surrounding pred is " + Utils.arrayToString(this.parser.getRuleInvocationStack()));
	        }
	    }
	    var c = null;
	    if (collectPredicates && (pt.isCtxDependent && inContext || !pt.isCtxDependent)) {
	        if (fullCtx) {
	            // In full context mode, we can evaluate predicates on-the-fly
	            // during closure, which dramatically reduces the size of
	            // the config sets. It also obviates the need to test predicates
	            // later during conflict resolution.
	            var currentPosition = this._input.index;
	            this._input.seek(this._startIndex);
	            var predSucceeds = pt.getPredicate().evaluate(this.parser, this._outerContext);
	            this._input.seek(currentPosition);
	            if (predSucceeds) {
	                c = new ATNConfig({ state: pt.target }, config); // no pred context
	            }
	        } else {
	            var newSemCtx = SemanticContext.andContext(config.semanticContext, pt.getPredicate());
	            c = new ATNConfig({ state: pt.target, semanticContext: newSemCtx }, config);
	        }
	    } else {
	        c = new ATNConfig({ state: pt.target }, config);
	    }
	    if (this.debug) {
	        console.log("config from pred transition=" + c);
	    }
	    return c;
	};

	ParserATNSimulator.prototype.ruleTransition = function (config, t) {
	    if (this.debug) {
	        console.log("CALL rule " + this.getRuleName(t.target.ruleIndex) + ", ctx=" + config.context);
	    }
	    var returnState = t.followState;
	    var newContext = SingletonPredictionContext.create(config.context, returnState.stateNumber);
	    return new ATNConfig({ state: t.target, context: newContext }, config);
	};

	ParserATNSimulator.prototype.getConflictingAlts = function (configs) {
	    var altsets = PredictionMode.getConflictingAltSubsets(configs);
	    return PredictionMode.getAlts(altsets);
	};

	// Sam pointed out a problem with the previous definition, v3, of
	// ambiguous states. If we have another state associated with conflicting
	// alternatives, we should keep going. For example, the following grammar
	//
	// s : (ID | ID ID?) ';' ;
	//
	// When the ATN simulation reaches the state before ';', it has a DFA
	// state that looks like: [12|1|[], 6|2|[], 12|2|[]]. Naturally
	// 12|1|[] and 12|2|[] conflict, but we cannot stop processing this node
	// because alternative to has another way to continue, via [6|2|[]].
	// The key is that we have a single state that has config's only associated
	// with a single alternative, 2, and crucially the state transitions
	// among the configurations are all non-epsilon transitions. That means
	// we don't consider any conflicts that include alternative 2. So, we
	// ignore the conflict between alts 1 and 2. We ignore a set of
	// conflicting alts when there is an intersection with an alternative
	// associated with a single alt state in the state&rarr;config-list map.
	//
	// It's also the case that we might have two conflicting configurations but
	// also a 3rd nonconflicting configuration for a different alternative:
	// [1|1|[], 1|2|[], 8|3|[]]. This can come about from grammar:
	//
	// a : A | A | A B ;
	//
	// After matching input A, we reach the stop state for rule A, state 1.
	// State 8 is the state right before B. Clearly alternatives 1 and 2
	// conflict and no amount of further lookahead will separate the two.
	// However, alternative 3 will be able to continue and so we do not
	// stop working on this state. In the previous example, we're concerned
	// with states associated with the conflicting alternatives. Here alt
	// 3 is not associated with the conflicting configs, but since we can continue
	// looking for input reasonably, I don't declare the state done. We
	// ignore a set of conflicting alts when we have an alternative
	// that we still need to pursue.
	//

	ParserATNSimulator.prototype.getConflictingAltsOrUniqueAlt = function (configs) {
	    var conflictingAlts = null;
	    if (configs.uniqueAlt !== ATN.INVALID_ALT_NUMBER) {
	        conflictingAlts = new BitSet();
	        conflictingAlts.add(configs.uniqueAlt);
	    } else {
	        conflictingAlts = configs.conflictingAlts;
	    }
	    return conflictingAlts;
	};

	ParserATNSimulator.prototype.getTokenName = function (t) {
	    if (t === Token.EOF) {
	        return "EOF";
	    }
	    if (this.parser !== null && this.parser.literalNames !== null) {
	        if (t >= this.parser.literalNames.length && t >= this.parser.symbolicNames.length) {
	            console.log("" + t + " ttype out of range: " + this.parser.literalNames);
	            console.log("" + this.parser.getInputStream().getTokens());
	        } else {
	            var name = this.parser.literalNames[t] || this.parser.symbolicNames[t];
	            return name + "<" + t + ">";
	        }
	    }
	    return "" + t;
	};

	ParserATNSimulator.prototype.getLookaheadName = function (input) {
	    return this.getTokenName(input.LA(1));
	};

	// Used for debugging in adaptivePredict around execATN but I cut
	//  it out for clarity now that alg. works well. We can leave this
	//  "dead" code for a bit.
	//
	ParserATNSimulator.prototype.dumpDeadEndConfigs = function (nvae) {
	    console.log("dead end configs: ");
	    var decs = nvae.getDeadEndConfigs();
	    for (var i = 0; i < decs.length; i++) {
	        var c = decs[i];
	        var trans = "no edges";
	        if (c.state.transitions.length > 0) {
	            var t = c.state.transitions[0];
	            if (t instanceof AtomTransition) {
	                trans = "Atom " + this.getTokenName(t.label);
	            } else if (t instanceof SetTransition) {
	                var neg = t instanceof NotSetTransition;
	                trans = (neg ? "~" : "") + "Set " + t.set;
	            }
	        }
	        console.error(c.toString(this.parser, true) + ":" + trans);
	    }
	};

	ParserATNSimulator.prototype.noViableAlt = function (input, outerContext, configs, startIndex) {
	    return new NoViableAltException(this.parser, input, input.get(startIndex), input.LT(1), configs, outerContext);
	};

	ParserATNSimulator.prototype.getUniqueAlt = function (configs) {
	    var alt = ATN.INVALID_ALT_NUMBER;
	    for (var i = 0; i < configs.items.length; i++) {
	        var c = configs.items[i];
	        if (alt === ATN.INVALID_ALT_NUMBER) {
	            alt = c.alt; // found first alt
	        } else if (c.alt !== alt) {
	            return ATN.INVALID_ALT_NUMBER;
	        }
	    }
	    return alt;
	};

	//
	// Add an edge to the DFA, if possible. This method calls
	// {@link //addDFAState} to ensure the {@code to} state is present in the
	// DFA. If {@code from} is {@code null}, or if {@code t} is outside the
	// range of edges that can be represented in the DFA tables, this method
	// returns without adding the edge to the DFA.
	//
	// <p>If {@code to} is {@code null}, this method returns {@code null}.
	// Otherwise, this method returns the {@link DFAState} returned by calling
	// {@link //addDFAState} for the {@code to} state.</p>
	//
	// @param dfa The DFA
	// @param from The source state for the edge
	// @param t The input symbol
	// @param to The target state for the edge
	//
	// @return If {@code to} is {@code null}, this method returns {@code null};
	// otherwise this method returns the result of calling {@link //addDFAState}
	// on {@code to}
	//
	ParserATNSimulator.prototype.addDFAEdge = function (dfa, from_, t, to) {
	    if (this.debug) {
	        console.log("EDGE " + from_ + " -> " + to + " upon " + this.getTokenName(t));
	    }
	    if (to === null) {
	        return null;
	    }
	    to = this.addDFAState(dfa, to); // used existing if possible not incoming
	    if (from_ === null || t < -1 || t > this.atn.maxTokenType) {
	        return to;
	    }
	    if (from_.edges === null) {
	        from_.edges = [];
	    }
	    from_.edges[t + 1] = to; // connect

	    if (this.debug) {
	        var literalNames = this.parser === null ? null : this.parser.literalNames;
	        var symbolicNames = this.parser === null ? null : this.parser.symbolicNames;
	        console.log("DFA=\n" + dfa.toString(literalNames, symbolicNames));
	    }
	    return to;
	};
	//
	// Add state {@code D} to the DFA if it is not already present, and return
	// the actual instance stored in the DFA. If a state equivalent to {@code D}
	// is already in the DFA, the existing state is returned. Otherwise this
	// method returns {@code D} after adding it to the DFA.
	//
	// <p>If {@code D} is {@link //ERROR}, this method returns {@link //ERROR} and
	// does not change the DFA.</p>
	//
	// @param dfa The dfa
	// @param D The DFA state to add
	// @return The state stored in the DFA. This will be either the existing
	// state if {@code D} is already in the DFA, or {@code D} itself if the
	// state was not already present.
	//
	ParserATNSimulator.prototype.addDFAState = function (dfa, D) {
	    if (D == ATNSimulator.ERROR) {
	        return D;
	    }
	    var existing = dfa.states.get(D);
	    if (existing !== null) {
	        return existing;
	    }
	    D.stateNumber = dfa.states.length;
	    if (!D.configs.readOnly) {
	        D.configs.optimizeConfigs(this);
	        D.configs.setReadonly(true);
	    }
	    dfa.states.add(D);
	    if (this.debug) {
	        console.log("adding new DFA state: " + D);
	    }
	    return D;
	};

	ParserATNSimulator.prototype.reportAttemptingFullContext = function (dfa, conflictingAlts, configs, startIndex, stopIndex) {
	    if (this.debug || this.retry_debug) {
	        var interval = new Interval(startIndex, stopIndex + 1);
	        console.log("reportAttemptingFullContext decision=" + dfa.decision + ":" + configs + ", input=" + this.parser.getTokenStream().getText(interval));
	    }
	    if (this.parser !== null) {
	        this.parser.getErrorListenerDispatch().reportAttemptingFullContext(this.parser, dfa, startIndex, stopIndex, conflictingAlts, configs);
	    }
	};

	ParserATNSimulator.prototype.reportContextSensitivity = function (dfa, prediction, configs, startIndex, stopIndex) {
	    if (this.debug || this.retry_debug) {
	        var interval = new Interval(startIndex, stopIndex + 1);
	        console.log("reportContextSensitivity decision=" + dfa.decision + ":" + configs + ", input=" + this.parser.getTokenStream().getText(interval));
	    }
	    if (this.parser !== null) {
	        this.parser.getErrorListenerDispatch().reportContextSensitivity(this.parser, dfa, startIndex, stopIndex, prediction, configs);
	    }
	};

	// If context sensitive parsing, we know it's ambiguity not conflict//
	ParserATNSimulator.prototype.reportAmbiguity = function (dfa, D, startIndex, stopIndex, exact, ambigAlts, configs) {
	    if (this.debug || this.retry_debug) {
	        var interval = new Interval(startIndex, stopIndex + 1);
	        console.log("reportAmbiguity " + ambigAlts + ":" + configs + ", input=" + this.parser.getTokenStream().getText(interval));
	    }
	    if (this.parser !== null) {
	        this.parser.getErrorListenerDispatch().reportAmbiguity(this.parser, dfa, startIndex, stopIndex, exact, ambigAlts, configs);
	    }
	};

	exports.ParserATNSimulator = ParserATNSimulator;

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//
	//
	// This enumeration defines the prediction modes available in ANTLR 4 along with
	// utility methods for analyzing configuration sets for conflicts and/or
	// ambiguities.

	var Set = __webpack_require__(5).Set;
	var Map = __webpack_require__(5).Map;
	var BitSet = __webpack_require__(5).BitSet;
	var AltDict = __webpack_require__(5).AltDict;
	var ATN = __webpack_require__(3).ATN;
	var RuleStopState = __webpack_require__(8).RuleStopState;
	var ATNConfigSet = __webpack_require__(29).ATNConfigSet;
	var ATNConfig = __webpack_require__(7).ATNConfig;
	var SemanticContext = __webpack_require__(9).SemanticContext;
	var Hash = __webpack_require__(5).Hash;
	var hashStuff = __webpack_require__(5).hashStuff;
	var equalArrays = __webpack_require__(5).equalArrays;

	function PredictionMode() {
	    return this;
	}

	//
	// The SLL(*) prediction mode. This prediction mode ignores the current
	// parser context when making predictions. This is the fastest prediction
	// mode, and provides correct results for many grammars. This prediction
	// mode is more powerful than the prediction mode provided by ANTLR 3, but
	// may result in syntax errors for grammar and input combinations which are
	// not SLL.
	//
	// <p>
	// When using this prediction mode, the parser will either return a correct
	// parse tree (i.e. the same parse tree that would be returned with the
	// {@link //LL} prediction mode), or it will report a syntax error. If a
	// syntax error is encountered when using the {@link //SLL} prediction mode,
	// it may be due to either an actual syntax error in the input or indicate
	// that the particular combination of grammar and input requires the more
	// powerful {@link //LL} prediction abilities to complete successfully.</p>
	//
	// <p>
	// This prediction mode does not provide any guarantees for prediction
	// behavior for syntactically-incorrect inputs.</p>
	//
	PredictionMode.SLL = 0;
	//
	// The LL(*) prediction mode. This prediction mode allows the current parser
	// context to be used for resolving SLL conflicts that occur during
	// prediction. This is the fastest prediction mode that guarantees correct
	// parse results for all combinations of grammars with syntactically correct
	// inputs.
	//
	// <p>
	// When using this prediction mode, the parser will make correct decisions
	// for all syntactically-correct grammar and input combinations. However, in
	// cases where the grammar is truly ambiguous this prediction mode might not
	// report a precise answer for <em>exactly which</em> alternatives are
	// ambiguous.</p>
	//
	// <p>
	// This prediction mode does not provide any guarantees for prediction
	// behavior for syntactically-incorrect inputs.</p>
	//
	PredictionMode.LL = 1;
	//
	// The LL(*) prediction mode with exact ambiguity detection. In addition to
	// the correctness guarantees provided by the {@link //LL} prediction mode,
	// this prediction mode instructs the prediction algorithm to determine the
	// complete and exact set of ambiguous alternatives for every ambiguous
	// decision encountered while parsing.
	//
	// <p>
	// This prediction mode may be used for diagnosing ambiguities during
	// grammar development. Due to the performance overhead of calculating sets
	// of ambiguous alternatives, this prediction mode should be avoided when
	// the exact results are not necessary.</p>
	//
	// <p>
	// This prediction mode does not provide any guarantees for prediction
	// behavior for syntactically-incorrect inputs.</p>
	//
	PredictionMode.LL_EXACT_AMBIG_DETECTION = 2;

	//
	// Computes the SLL prediction termination condition.
	//
	// <p>
	// This method computes the SLL prediction termination condition for both of
	// the following cases.</p>
	//
	// <ul>
	// <li>The usual SLL+LL fallback upon SLL conflict</li>
	// <li>Pure SLL without LL fallback</li>
	// </ul>
	//
	// <p><strong>COMBINED SLL+LL PARSING</strong></p>
	//
	// <p>When LL-fallback is enabled upon SLL conflict, correct predictions are
	// ensured regardless of how the termination condition is computed by this
	// method. Due to the substantially higher cost of LL prediction, the
	// prediction should only fall back to LL when the additional lookahead
	// cannot lead to a unique SLL prediction.</p>
	//
	// <p>Assuming combined SLL+LL parsing, an SLL configuration set with only
	// conflicting subsets should fall back to full LL, even if the
	// configuration sets don't resolve to the same alternative (e.g.
	// {@code {1,2}} and {@code {3,4}}. If there is at least one non-conflicting
	// configuration, SLL could continue with the hopes that more lookahead will
	// resolve via one of those non-conflicting configurations.</p>
	//
	// <p>Here's the prediction termination rule them: SLL (for SLL+LL parsing)
	// stops when it sees only conflicting configuration subsets. In contrast,
	// full LL keeps going when there is uncertainty.</p>
	//
	// <p><strong>HEURISTIC</strong></p>
	//
	// <p>As a heuristic, we stop prediction when we see any conflicting subset
	// unless we see a state that only has one alternative associated with it.
	// The single-alt-state thing lets prediction continue upon rules like
	// (otherwise, it would admit defeat too soon):</p>
	//
	// <p>{@code [12|1|[], 6|2|[], 12|2|[]]. s : (ID | ID ID?) ';' ;}</p>
	//
	// <p>When the ATN simulation reaches the state before {@code ';'}, it has a
	// DFA state that looks like: {@code [12|1|[], 6|2|[], 12|2|[]]}. Naturally
	// {@code 12|1|[]} and {@code 12|2|[]} conflict, but we cannot stop
	// processing this node because alternative to has another way to continue,
	// via {@code [6|2|[]]}.</p>
	//
	// <p>It also let's us continue for this rule:</p>
	//
	// <p>{@code [1|1|[], 1|2|[], 8|3|[]] a : A | A | A B ;}</p>
	//
	// <p>After matching input A, we reach the stop state for rule A, state 1.
	// State 8 is the state right before B. Clearly alternatives 1 and 2
	// conflict and no amount of further lookahead will separate the two.
	// However, alternative 3 will be able to continue and so we do not stop
	// working on this state. In the previous example, we're concerned with
	// states associated with the conflicting alternatives. Here alt 3 is not
	// associated with the conflicting configs, but since we can continue
	// looking for input reasonably, don't declare the state done.</p>
	//
	// <p><strong>PURE SLL PARSING</strong></p>
	//
	// <p>To handle pure SLL parsing, all we have to do is make sure that we
	// combine stack contexts for configurations that differ only by semantic
	// predicate. From there, we can do the usual SLL termination heuristic.</p>
	//
	// <p><strong>PREDICATES IN SLL+LL PARSING</strong></p>
	//
	// <p>SLL decisions don't evaluate predicates until after they reach DFA stop
	// states because they need to create the DFA cache that works in all
	// semantic situations. In contrast, full LL evaluates predicates collected
	// during start state computation so it can ignore predicates thereafter.
	// This means that SLL termination detection can totally ignore semantic
	// predicates.</p>
	//
	// <p>Implementation-wise, {@link ATNConfigSet} combines stack contexts but not
	// semantic predicate contexts so we might see two configurations like the
	// following.</p>
	//
	// <p>{@code (s, 1, x, {}), (s, 1, x', {p})}</p>
	//
	// <p>Before testing these configurations against others, we have to merge
	// {@code x} and {@code x'} (without modifying the existing configurations).
	// For example, we test {@code (x+x')==x''} when looking for conflicts in
	// the following configurations.</p>
	//
	// <p>{@code (s, 1, x, {}), (s, 1, x', {p}), (s, 2, x'', {})}</p>
	//
	// <p>If the configuration set has predicates (as indicated by
	// {@link ATNConfigSet//hasSemanticContext}), this algorithm makes a copy of
	// the configurations to strip out all of the predicates so that a standard
	// {@link ATNConfigSet} will merge everything ignoring predicates.</p>
	//
	PredictionMode.hasSLLConflictTerminatingPrediction = function (mode, configs) {
	    // Configs in rule stop states indicate reaching the end of the decision
	    // rule (local context) or end of start rule (full context). If all
	    // configs meet this condition, then none of the configurations is able
	    // to match additional input so we terminate prediction.
	    //
	    if (PredictionMode.allConfigsInRuleStopStates(configs)) {
	        return true;
	    }
	    // pure SLL mode parsing
	    if (mode === PredictionMode.SLL) {
	        // Don't bother with combining configs from different semantic
	        // contexts if we can fail over to full LL; costs more time
	        // since we'll often fail over anyway.
	        if (configs.hasSemanticContext) {
	            // dup configs, tossing out semantic predicates
	            var dup = new ATNConfigSet();
	            for (var i = 0; i < configs.items.length; i++) {
	                var c = configs.items[i];
	                c = new ATNConfig({ semanticContext: SemanticContext.NONE }, c);
	                dup.add(c);
	            }
	            configs = dup;
	        }
	        // now we have combined contexts for configs with dissimilar preds
	    }
	    // pure SLL or combined SLL+LL mode parsing
	    var altsets = PredictionMode.getConflictingAltSubsets(configs);
	    return PredictionMode.hasConflictingAltSet(altsets) && !PredictionMode.hasStateAssociatedWithOneAlt(configs);
	};

	// Checks if any configuration in {@code configs} is in a
	// {@link RuleStopState}. Configurations meeting this condition have reached
	// the end of the decision rule (local context) or end of start rule (full
	// context).
	//
	// @param configs the configuration set to test
	// @return {@code true} if any configuration in {@code configs} is in a
	// {@link RuleStopState}, otherwise {@code false}
	PredictionMode.hasConfigInRuleStopState = function (configs) {
	    for (var i = 0; i < configs.items.length; i++) {
	        var c = configs.items[i];
	        if (c.state instanceof RuleStopState) {
	            return true;
	        }
	    }
	    return false;
	};

	// Checks if all configurations in {@code configs} are in a
	// {@link RuleStopState}. Configurations meeting this condition have reached
	// the end of the decision rule (local context) or end of start rule (full
	// context).
	//
	// @param configs the configuration set to test
	// @return {@code true} if all configurations in {@code configs} are in a
	// {@link RuleStopState}, otherwise {@code false}
	PredictionMode.allConfigsInRuleStopStates = function (configs) {
	    for (var i = 0; i < configs.items.length; i++) {
	        var c = configs.items[i];
	        if (!(c.state instanceof RuleStopState)) {
	            return false;
	        }
	    }
	    return true;
	};

	//
	// Full LL prediction termination.
	//
	// <p>Can we stop looking ahead during ATN simulation or is there some
	// uncertainty as to which alternative we will ultimately pick, after
	// consuming more input? Even if there are partial conflicts, we might know
	// that everything is going to resolve to the same minimum alternative. That
	// means we can stop since no more lookahead will change that fact. On the
	// other hand, there might be multiple conflicts that resolve to different
	// minimums. That means we need more look ahead to decide which of those
	// alternatives we should predict.</p>
	//
	// <p>The basic idea is to split the set of configurations {@code C}, into
	// conflicting subsets {@code (s, _, ctx, _)} and singleton subsets with
	// non-conflicting configurations. Two configurations conflict if they have
	// identical {@link ATNConfig//state} and {@link ATNConfig//context} values
	// but different {@link ATNConfig//alt} value, e.g. {@code (s, i, ctx, _)}
	// and {@code (s, j, ctx, _)} for {@code i!=j}.</p>
	//
	// <p>Reduce these configuration subsets to the set of possible alternatives.
	// You can compute the alternative subsets in one pass as follows:</p>
	//
	// <p>{@code A_s,ctx = {i | (s, i, ctx, _)}} for each configuration in
	// {@code C} holding {@code s} and {@code ctx} fixed.</p>
	//
	// <p>Or in pseudo-code, for each configuration {@code c} in {@code C}:</p>
	//
	// <pre>
	// map[c] U= c.{@link ATNConfig//alt alt} // map hash/equals uses s and x, not
	// alt and not pred
	// </pre>
	//
	// <p>The values in {@code map} are the set of {@code A_s,ctx} sets.</p>
	//
	// <p>If {@code |A_s,ctx|=1} then there is no conflict associated with
	// {@code s} and {@code ctx}.</p>
	//
	// <p>Reduce the subsets to singletons by choosing a minimum of each subset. If
	// the union of these alternative subsets is a singleton, then no amount of
	// more lookahead will help us. We will always pick that alternative. If,
	// however, there is more than one alternative, then we are uncertain which
	// alternative to predict and must continue looking for resolution. We may
	// or may not discover an ambiguity in the future, even if there are no
	// conflicting subsets this round.</p>
	//
	// <p>The biggest sin is to terminate early because it means we've made a
	// decision but were uncertain as to the eventual outcome. We haven't used
	// enough lookahead. On the other hand, announcing a conflict too late is no
	// big deal; you will still have the conflict. It's just inefficient. It
	// might even look until the end of file.</p>
	//
	// <p>No special consideration for semantic predicates is required because
	// predicates are evaluated on-the-fly for full LL prediction, ensuring that
	// no configuration contains a semantic context during the termination
	// check.</p>
	//
	// <p><strong>CONFLICTING CONFIGS</strong></p>
	//
	// <p>Two configurations {@code (s, i, x)} and {@code (s, j, x')}, conflict
	// when {@code i!=j} but {@code x=x'}. Because we merge all
	// {@code (s, i, _)} configurations together, that means that there are at
	// most {@code n} configurations associated with state {@code s} for
	// {@code n} possible alternatives in the decision. The merged stacks
	// complicate the comparison of configuration contexts {@code x} and
	// {@code x'}. Sam checks to see if one is a subset of the other by calling
	// merge and checking to see if the merged result is either {@code x} or
	// {@code x'}. If the {@code x} associated with lowest alternative {@code i}
	// is the superset, then {@code i} is the only possible prediction since the
	// others resolve to {@code min(i)} as well. However, if {@code x} is
	// associated with {@code j>i} then at least one stack configuration for
	// {@code j} is not in conflict with alternative {@code i}. The algorithm
	// should keep going, looking for more lookahead due to the uncertainty.</p>
	//
	// <p>For simplicity, I'm doing a equality check between {@code x} and
	// {@code x'} that lets the algorithm continue to consume lookahead longer
	// than necessary. The reason I like the equality is of course the
	// simplicity but also because that is the test you need to detect the
	// alternatives that are actually in conflict.</p>
	//
	// <p><strong>CONTINUE/STOP RULE</strong></p>
	//
	// <p>Continue if union of resolved alternative sets from non-conflicting and
	// conflicting alternative subsets has more than one alternative. We are
	// uncertain about which alternative to predict.</p>
	//
	// <p>The complete set of alternatives, {@code [i for (_,i,_)]}, tells us which
	// alternatives are still in the running for the amount of input we've
	// consumed at this point. The conflicting sets let us to strip away
	// configurations that won't lead to more states because we resolve
	// conflicts to the configuration with a minimum alternate for the
	// conflicting set.</p>
	//
	// <p><strong>CASES</strong></p>
	//
	// <ul>
	//
	// <li>no conflicts and more than 1 alternative in set =&gt; continue</li>
	//
	// <li> {@code (s, 1, x)}, {@code (s, 2, x)}, {@code (s, 3, z)},
	// {@code (s', 1, y)}, {@code (s', 2, y)} yields non-conflicting set
	// {@code {3}} U conflicting sets {@code min({1,2})} U {@code min({1,2})} =
	// {@code {1,3}} =&gt; continue
	// </li>
	//
	// <li>{@code (s, 1, x)}, {@code (s, 2, x)}, {@code (s', 1, y)},
	// {@code (s', 2, y)}, {@code (s'', 1, z)} yields non-conflicting set
	// {@code {1}} U conflicting sets {@code min({1,2})} U {@code min({1,2})} =
	// {@code {1}} =&gt; stop and predict 1</li>
	//
	// <li>{@code (s, 1, x)}, {@code (s, 2, x)}, {@code (s', 1, y)},
	// {@code (s', 2, y)} yields conflicting, reduced sets {@code {1}} U
	// {@code {1}} = {@code {1}} =&gt; stop and predict 1, can announce
	// ambiguity {@code {1,2}}</li>
	//
	// <li>{@code (s, 1, x)}, {@code (s, 2, x)}, {@code (s', 2, y)},
	// {@code (s', 3, y)} yields conflicting, reduced sets {@code {1}} U
	// {@code {2}} = {@code {1,2}} =&gt; continue</li>
	//
	// <li>{@code (s, 1, x)}, {@code (s, 2, x)}, {@code (s', 3, y)},
	// {@code (s', 4, y)} yields conflicting, reduced sets {@code {1}} U
	// {@code {3}} = {@code {1,3}} =&gt; continue</li>
	//
	// </ul>
	//
	// <p><strong>EXACT AMBIGUITY DETECTION</strong></p>
	//
	// <p>If all states report the same conflicting set of alternatives, then we
	// know we have the exact ambiguity set.</p>
	//
	// <p><code>|A_<em>i</em>|&gt;1</code> and
	// <code>A_<em>i</em> = A_<em>j</em></code> for all <em>i</em>, <em>j</em>.</p>
	//
	// <p>In other words, we continue examining lookahead until all {@code A_i}
	// have more than one alternative and all {@code A_i} are the same. If
	// {@code A={{1,2}, {1,3}}}, then regular LL prediction would terminate
	// because the resolved set is {@code {1}}. To determine what the real
	// ambiguity is, we have to know whether the ambiguity is between one and
	// two or one and three so we keep going. We can only stop prediction when
	// we need exact ambiguity detection when the sets look like
	// {@code A={{1,2}}} or {@code {{1,2},{1,2}}}, etc...</p>
	//
	PredictionMode.resolvesToJustOneViableAlt = function (altsets) {
	    return PredictionMode.getSingleViableAlt(altsets);
	};

	//
	// Determines if every alternative subset in {@code altsets} contains more
	// than one alternative.
	//
	// @param altsets a collection of alternative subsets
	// @return {@code true} if every {@link BitSet} in {@code altsets} has
	// {@link BitSet//cardinality cardinality} &gt; 1, otherwise {@code false}
	//
	PredictionMode.allSubsetsConflict = function (altsets) {
	    return !PredictionMode.hasNonConflictingAltSet(altsets);
	};
	//
	// Determines if any single alternative subset in {@code altsets} contains
	// exactly one alternative.
	//
	// @param altsets a collection of alternative subsets
	// @return {@code true} if {@code altsets} contains a {@link BitSet} with
	// {@link BitSet//cardinality cardinality} 1, otherwise {@code false}
	//
	PredictionMode.hasNonConflictingAltSet = function (altsets) {
	    for (var i = 0; i < altsets.length; i++) {
	        var alts = altsets[i];
	        if (alts.length === 1) {
	            return true;
	        }
	    }
	    return false;
	};

	//
	// Determines if any single alternative subset in {@code altsets} contains
	// more than one alternative.
	//
	// @param altsets a collection of alternative subsets
	// @return {@code true} if {@code altsets} contains a {@link BitSet} with
	// {@link BitSet//cardinality cardinality} &gt; 1, otherwise {@code false}
	//
	PredictionMode.hasConflictingAltSet = function (altsets) {
	    for (var i = 0; i < altsets.length; i++) {
	        var alts = altsets[i];
	        if (alts.length > 1) {
	            return true;
	        }
	    }
	    return false;
	};

	//
	// Determines if every alternative subset in {@code altsets} is equivalent.
	//
	// @param altsets a collection of alternative subsets
	// @return {@code true} if every member of {@code altsets} is equal to the
	// others, otherwise {@code false}
	//
	PredictionMode.allSubsetsEqual = function (altsets) {
	    var first = null;
	    for (var i = 0; i < altsets.length; i++) {
	        var alts = altsets[i];
	        if (first === null) {
	            first = alts;
	        } else if (alts !== first) {
	            return false;
	        }
	    }
	    return true;
	};

	//
	// Returns the unique alternative predicted by all alternative subsets in
	// {@code altsets}. If no such alternative exists, this method returns
	// {@link ATN//INVALID_ALT_NUMBER}.
	//
	// @param altsets a collection of alternative subsets
	//
	PredictionMode.getUniqueAlt = function (altsets) {
	    var all = PredictionMode.getAlts(altsets);
	    if (all.length === 1) {
	        return all.minValue();
	    } else {
	        return ATN.INVALID_ALT_NUMBER;
	    }
	};

	// Gets the complete set of represented alternatives for a collection of
	// alternative subsets. This method returns the union of each {@link BitSet}
	// in {@code altsets}.
	//
	// @param altsets a collection of alternative subsets
	// @return the set of represented alternatives in {@code altsets}
	//
	PredictionMode.getAlts = function (altsets) {
	    var all = new BitSet();
	    altsets.map(function (alts) {
	        all.or(alts);
	    });
	    return all;
	};

	//
	// This function gets the conflicting alt subsets from a configuration set.
	// For each configuration {@code c} in {@code configs}:
	//
	// <pre>
	// map[c] U= c.{@link ATNConfig//alt alt} // map hash/equals uses s and x, not
	// alt and not pred
	// </pre>

	PredictionMode.getConflictingAltSubsets = function (configs) {
	    var configToAlts = new Map();
	    configToAlts.hashFunction = function (cfg) {
	        hashStuff(cfg.state.stateNumber, cfg.context);
	    };
	    configToAlts.equalsFunction = function (c1, c2) {
	        return c1.state.stateNumber == c2.state.stateNumber && c1.context.equals(c2.context);
	    };
	    configs.items.map(function (cfg) {
	        var alts = configToAlts.get(cfg);
	        if (alts === null) {
	            alts = new BitSet();
	            configToAlts.put(cfg, alts);
	        }
	        alts.add(cfg.alt);
	    });
	    return configToAlts.getValues();
	};

	//
	// Get a map from state to alt subset from a configuration set. For each
	// configuration {@code c} in {@code configs}:
	//
	// <pre>
	// map[c.{@link ATNConfig//state state}] U= c.{@link ATNConfig//alt alt}
	// </pre>
	//
	PredictionMode.getStateToAltMap = function (configs) {
	    var m = new AltDict();
	    configs.items.map(function (c) {
	        var alts = m.get(c.state);
	        if (alts === null) {
	            alts = new BitSet();
	            m.put(c.state, alts);
	        }
	        alts.add(c.alt);
	    });
	    return m;
	};

	PredictionMode.hasStateAssociatedWithOneAlt = function (configs) {
	    var values = PredictionMode.getStateToAltMap(configs).values();
	    for (var i = 0; i < values.length; i++) {
	        if (values[i].length === 1) {
	            return true;
	        }
	    }
	    return false;
	};

	PredictionMode.getSingleViableAlt = function (altsets) {
	    var result = null;
	    for (var i = 0; i < altsets.length; i++) {
	        var alts = altsets[i];
	        var minAlt = alts.minValue();
	        if (result === null) {
	            result = minAlt;
	        } else if (result !== minAlt) {
	            // more than 1 viable alt
	            return ATN.INVALID_ALT_NUMBER;
	        }
	    }
	    return result;
	};

	exports.PredictionMode = PredictionMode;

/***/ },
/* 33 */
/***/ function(module, exports) {

	'use strict';

	/*! https://mths.be/codepointat v0.2.0 by @mathias */
	if (!String.prototype.codePointAt) {
		(function () {
			'use strict'; // needed to support `apply`/`call` with `undefined`/`null`

			var defineProperty = function () {
				// IE 8 only supports `Object.defineProperty` on DOM elements
				try {
					var object = {};
					var $defineProperty = Object.defineProperty;
					var result = $defineProperty(object, object, object) && $defineProperty;
				} catch (error) {}
				return result;
			}();
			var codePointAt = function codePointAt(position) {
				if (this == null) {
					throw TypeError();
				}
				var string = String(this);
				var size = string.length;
				// `ToInteger`
				var index = position ? Number(position) : 0;
				if (index != index) {
					// better `isNaN`
					index = 0;
				}
				// Account for out-of-bounds indices:
				if (index < 0 || index >= size) {
					return undefined;
				}
				// Get the first code unit
				var first = string.charCodeAt(index);
				var second;
				if ( // check if it’s the start of a surrogate pair
				first >= 0xD800 && first <= 0xDBFF && // high surrogate
				size > index + 1 // there is a next code unit
				) {
						second = string.charCodeAt(index + 1);
						if (second >= 0xDC00 && second <= 0xDFFF) {
							// low surrogate
							// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
							return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
						}
					}
				return first;
			};
			if (defineProperty) {
				defineProperty(String.prototype, 'codePointAt', {
					'value': codePointAt,
					'configurable': true,
					'writable': true
				});
			} else {
				String.prototype.codePointAt = codePointAt;
			}
		})();
	}

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	exports.DFA = __webpack_require__(35).DFA;
	exports.DFASerializer = __webpack_require__(36).DFASerializer;
	exports.LexerDFASerializer = __webpack_require__(36).LexerDFASerializer;
	exports.PredPrediction = __webpack_require__(28).PredPrediction;

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	var Set = __webpack_require__(5).Set;
	var DFAState = __webpack_require__(28).DFAState;
	var StarLoopEntryState = __webpack_require__(8).StarLoopEntryState;
	var ATNConfigSet = __webpack_require__(29).ATNConfigSet;
	var DFASerializer = __webpack_require__(36).DFASerializer;
	var LexerDFASerializer = __webpack_require__(36).LexerDFASerializer;

	function DFA(atnStartState, decision) {
		if (decision === undefined) {
			decision = 0;
		}
		// From which ATN state did we create this DFA?
		this.atnStartState = atnStartState;
		this.decision = decision;
		// A set of all DFA states. Use {@link Map} so we can get old state back
		// ({@link Set} only allows you to see if it's there).
		this._states = new Set();
		this.s0 = null;
		// {@code true} if this DFA is for a precedence decision; otherwise,
		// {@code false}. This is the backing field for {@link //isPrecedenceDfa},
		// {@link //setPrecedenceDfa}.
		this.precedenceDfa = false;
		if (atnStartState instanceof StarLoopEntryState) {
			if (atnStartState.isPrecedenceDecision) {
				this.precedenceDfa = true;
				var precedenceState = new DFAState(null, new ATNConfigSet());
				precedenceState.edges = [];
				precedenceState.isAcceptState = false;
				precedenceState.requiresFullContext = false;
				this.s0 = precedenceState;
			}
		}
		return this;
	}

	// Get the start state for a specific precedence value.
	//
	// @param precedence The current precedence.
	// @return The start state corresponding to the specified precedence, or
	// {@code null} if no start state exists for the specified precedence.
	//
	// @throws IllegalStateException if this is not a precedence DFA.
	// @see //isPrecedenceDfa()

	DFA.prototype.getPrecedenceStartState = function (precedence) {
		if (!this.precedenceDfa) {
			throw "Only precedence DFAs may contain a precedence start state.";
		}
		// s0.edges is never null for a precedence DFA
		if (precedence < 0 || precedence >= this.s0.edges.length) {
			return null;
		}
		return this.s0.edges[precedence] || null;
	};

	// Set the start state for a specific precedence value.
	//
	// @param precedence The current precedence.
	// @param startState The start state corresponding to the specified
	// precedence.
	//
	// @throws IllegalStateException if this is not a precedence DFA.
	// @see //isPrecedenceDfa()
	//
	DFA.prototype.setPrecedenceStartState = function (precedence, startState) {
		if (!this.precedenceDfa) {
			throw "Only precedence DFAs may contain a precedence start state.";
		}
		if (precedence < 0) {
			return;
		}

		// synchronization on s0 here is ok. when the DFA is turned into a
		// precedence DFA, s0 will be initialized once and not updated again
		// s0.edges is never null for a precedence DFA
		this.s0.edges[precedence] = startState;
	};

	//
	// Sets whether this is a precedence DFA. If the specified value differs
	// from the current DFA configuration, the following actions are taken;
	// otherwise no changes are made to the current DFA.
	//
	// <ul>
	// <li>The {@link //states} map is cleared</li>
	// <li>If {@code precedenceDfa} is {@code false}, the initial state
	// {@link //s0} is set to {@code null}; otherwise, it is initialized to a new
	// {@link DFAState} with an empty outgoing {@link DFAState//edges} array to
	// store the start states for individual precedence values.</li>
	// <li>The {@link //precedenceDfa} field is updated</li>
	// </ul>
	//
	// @param precedenceDfa {@code true} if this is a precedence DFA; otherwise,
	// {@code false}

	DFA.prototype.setPrecedenceDfa = function (precedenceDfa) {
		if (this.precedenceDfa !== precedenceDfa) {
			this._states = new DFAStatesSet();
			if (precedenceDfa) {
				var precedenceState = new DFAState(null, new ATNConfigSet());
				precedenceState.edges = [];
				precedenceState.isAcceptState = false;
				precedenceState.requiresFullContext = false;
				this.s0 = precedenceState;
			} else {
				this.s0 = null;
			}
			this.precedenceDfa = precedenceDfa;
		}
	};

	Object.defineProperty(DFA.prototype, "states", {
		get: function get() {
			return this._states;
		}
	});

	// Return a list of all states in this DFA, ordered by state number.
	DFA.prototype.sortedStates = function () {
		var list = this._states.values();
		return list.sort(function (a, b) {
			return a.stateNumber - b.stateNumber;
		});
	};

	DFA.prototype.toString = function (literalNames, symbolicNames) {
		literalNames = literalNames || null;
		symbolicNames = symbolicNames || null;
		if (this.s0 === null) {
			return "";
		}
		var serializer = new DFASerializer(this, literalNames, symbolicNames);
		return serializer.toString();
	};

	DFA.prototype.toLexerString = function () {
		if (this.s0 === null) {
			return "";
		}
		var serializer = new LexerDFASerializer(this);
		return serializer.toString();
	};

	exports.DFA = DFA;

/***/ },
/* 36 */
/***/ function(module, exports) {

	"use strict";

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	// A DFA walker that knows how to dump them to serialized strings.#/


	function DFASerializer(dfa, literalNames, symbolicNames) {
	    this.dfa = dfa;
	    this.literalNames = literalNames || [];
	    this.symbolicNames = symbolicNames || [];
	    return this;
	}

	DFASerializer.prototype.toString = function () {
	    if (this.dfa.s0 === null) {
	        return null;
	    }
	    var buf = "";
	    var states = this.dfa.sortedStates();
	    for (var i = 0; i < states.length; i++) {
	        var s = states[i];
	        if (s.edges !== null) {
	            var n = s.edges.length;
	            for (var j = 0; j < n; j++) {
	                var t = s.edges[j] || null;
	                if (t !== null && t.stateNumber !== 0x7FFFFFFF) {
	                    buf = buf.concat(this.getStateString(s));
	                    buf = buf.concat("-");
	                    buf = buf.concat(this.getEdgeLabel(j));
	                    buf = buf.concat("->");
	                    buf = buf.concat(this.getStateString(t));
	                    buf = buf.concat('\n');
	                }
	            }
	        }
	    }
	    return buf.length === 0 ? null : buf;
	};

	DFASerializer.prototype.getEdgeLabel = function (i) {
	    if (i === 0) {
	        return "EOF";
	    } else if (this.literalNames !== null || this.symbolicNames !== null) {
	        return this.literalNames[i - 1] || this.symbolicNames[i - 1];
	    } else {
	        return String.fromCharCode(i - 1);
	    }
	};

	DFASerializer.prototype.getStateString = function (s) {
	    var baseStateStr = (s.isAcceptState ? ":" : "") + "s" + s.stateNumber + (s.requiresFullContext ? "^" : "");
	    if (s.isAcceptState) {
	        if (s.predicates !== null) {
	            return baseStateStr + "=>" + s.predicates.toString();
	        } else {
	            return baseStateStr + "=>" + s.prediction.toString();
	        }
	    } else {
	        return baseStateStr;
	    }
	};

	function LexerDFASerializer(dfa) {
	    DFASerializer.call(this, dfa, null);
	    return this;
	}

	LexerDFASerializer.prototype = Object.create(DFASerializer.prototype);
	LexerDFASerializer.prototype.constructor = LexerDFASerializer;

	LexerDFASerializer.prototype.getEdgeLabel = function (i) {
	    return "'" + String.fromCharCode(i) + "'";
	};

	exports.DFASerializer = DFASerializer;
	exports.LexerDFASerializer = LexerDFASerializer;

/***/ },
/* 37 */
/***/ function(module, exports) {

	'use strict';

	/*! https://mths.be/fromcodepoint v0.2.1 by @mathias */
	if (!String.fromCodePoint) {
		(function () {
			var defineProperty = function () {
				// IE 8 only supports `Object.defineProperty` on DOM elements
				try {
					var object = {};
					var $defineProperty = Object.defineProperty;
					var result = $defineProperty(object, object, object) && $defineProperty;
				} catch (error) {}
				return result;
			}();
			var stringFromCharCode = String.fromCharCode;
			var floor = Math.floor;
			var fromCodePoint = function fromCodePoint(_) {
				var MAX_SIZE = 0x4000;
				var codeUnits = [];
				var highSurrogate;
				var lowSurrogate;
				var index = -1;
				var length = arguments.length;
				if (!length) {
					return '';
				}
				var result = '';
				while (++index < length) {
					var codePoint = Number(arguments[index]);
					if (!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
					codePoint < 0 || // not a valid Unicode code point
					codePoint > 0x10FFFF || // not a valid Unicode code point
					floor(codePoint) != codePoint // not an integer
					) {
							throw RangeError('Invalid code point: ' + codePoint);
						}
					if (codePoint <= 0xFFFF) {
						// BMP code point
						codeUnits.push(codePoint);
					} else {
						// Astral code point; split in surrogate halves
						// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
						codePoint -= 0x10000;
						highSurrogate = (codePoint >> 10) + 0xD800;
						lowSurrogate = codePoint % 0x400 + 0xDC00;
						codeUnits.push(highSurrogate, lowSurrogate);
					}
					if (index + 1 == length || codeUnits.length > MAX_SIZE) {
						result += stringFromCharCode.apply(null, codeUnits);
						codeUnits.length = 0;
					}
				}
				return result;
			};
			if (defineProperty) {
				defineProperty(String, 'fromCodePoint', {
					'value': fromCodePoint,
					'configurable': true,
					'writable': true
				});
			} else {
				String.fromCodePoint = fromCodePoint;
			}
		})();
	}

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	var Tree = __webpack_require__(14);
	exports.Trees = __webpack_require__(15).Trees;
	exports.RuleNode = Tree.RuleNode;
	exports.ParseTreeListener = Tree.ParseTreeListener;
	exports.ParseTreeVisitor = Tree.ParseTreeVisitor;
	exports.ParseTreeWalker = Tree.ParseTreeWalker;

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	exports.RecognitionException = __webpack_require__(26).RecognitionException;
	exports.NoViableAltException = __webpack_require__(26).NoViableAltException;
	exports.LexerNoViableAltException = __webpack_require__(26).LexerNoViableAltException;
	exports.InputMismatchException = __webpack_require__(26).InputMismatchException;
	exports.FailedPredicateException = __webpack_require__(26).FailedPredicateException;
	exports.DiagnosticErrorListener = __webpack_require__(40).DiagnosticErrorListener;
	exports.BailErrorStrategy = __webpack_require__(41).BailErrorStrategy;
	exports.ErrorListener = __webpack_require__(24).ErrorListener;

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	//
	// This implementation of {@link ANTLRErrorListener} can be used to identify
	// certain potential correctness and performance problems in grammars. "Reports"
	// are made by calling {@link Parser//notifyErrorListeners} with the appropriate
	// message.
	//
	// <ul>
	// <li><b>Ambiguities</b>: These are cases where more than one path through the
	// grammar can match the input.</li>
	// <li><b>Weak context sensitivity</b>: These are cases where full-context
	// prediction resolved an SLL conflict to a unique alternative which equaled the
	// minimum alternative of the SLL conflict.</li>
	// <li><b>Strong (forced) context sensitivity</b>: These are cases where the
	// full-context prediction resolved an SLL conflict to a unique alternative,
	// <em>and</em> the minimum alternative of the SLL conflict was found to not be
	// a truly viable alternative. Two-stage parsing cannot be used for inputs where
	// this situation occurs.</li>
	// </ul>

	var BitSet = __webpack_require__(5).BitSet;
	var ErrorListener = __webpack_require__(24).ErrorListener;
	var Interval = __webpack_require__(10).Interval;

	function DiagnosticErrorListener(exactOnly) {
		ErrorListener.call(this);
		exactOnly = exactOnly || true;
		// whether all ambiguities or only exact ambiguities are reported.
		this.exactOnly = exactOnly;
		return this;
	}

	DiagnosticErrorListener.prototype = Object.create(ErrorListener.prototype);
	DiagnosticErrorListener.prototype.constructor = DiagnosticErrorListener;

	DiagnosticErrorListener.prototype.reportAmbiguity = function (recognizer, dfa, startIndex, stopIndex, exact, ambigAlts, configs) {
		if (this.exactOnly && !exact) {
			return;
		}
		var msg = "reportAmbiguity d=" + this.getDecisionDescription(recognizer, dfa) + ": ambigAlts=" + this.getConflictingAlts(ambigAlts, configs) + ", input='" + recognizer.getTokenStream().getText(new Interval(startIndex, stopIndex)) + "'";
		recognizer.notifyErrorListeners(msg);
	};

	DiagnosticErrorListener.prototype.reportAttemptingFullContext = function (recognizer, dfa, startIndex, stopIndex, conflictingAlts, configs) {
		var msg = "reportAttemptingFullContext d=" + this.getDecisionDescription(recognizer, dfa) + ", input='" + recognizer.getTokenStream().getText(new Interval(startIndex, stopIndex)) + "'";
		recognizer.notifyErrorListeners(msg);
	};

	DiagnosticErrorListener.prototype.reportContextSensitivity = function (recognizer, dfa, startIndex, stopIndex, prediction, configs) {
		var msg = "reportContextSensitivity d=" + this.getDecisionDescription(recognizer, dfa) + ", input='" + recognizer.getTokenStream().getText(new Interval(startIndex, stopIndex)) + "'";
		recognizer.notifyErrorListeners(msg);
	};

	DiagnosticErrorListener.prototype.getDecisionDescription = function (recognizer, dfa) {
		var decision = dfa.decision;
		var ruleIndex = dfa.atnStartState.ruleIndex;

		var ruleNames = recognizer.ruleNames;
		if (ruleIndex < 0 || ruleIndex >= ruleNames.length) {
			return "" + decision;
		}
		var ruleName = ruleNames[ruleIndex] || null;
		if (ruleName === null || ruleName.length === 0) {
			return "" + decision;
		}
		return "" + decision + " (" + ruleName + ")";
	};

	//
	// Computes the set of conflicting or ambiguous alternatives from a
	// configuration set, if that information was not already provided by the
	// parser.
	//
	// @param reportedAlts The set of conflicting or ambiguous alternatives, as
	// reported by the parser.
	// @param configs The conflicting or ambiguous configuration set.
	// @return Returns {@code reportedAlts} if it is not {@code null}, otherwise
	// returns the set of alternatives represented in {@code configs}.
	//
	DiagnosticErrorListener.prototype.getConflictingAlts = function (reportedAlts, configs) {
		if (reportedAlts !== null) {
			return reportedAlts;
		}
		var result = new BitSet();
		for (var i = 0; i < configs.items.length; i++) {
			result.add(configs.items[i].alt);
		}
		return "{" + result.values().join(", ") + "}";
	};

	exports.DiagnosticErrorListener = DiagnosticErrorListener;

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	var Token = __webpack_require__(6).Token;
	var Errors = __webpack_require__(26);
	var NoViableAltException = Errors.NoViableAltException;
	var InputMismatchException = Errors.InputMismatchException;
	var FailedPredicateException = Errors.FailedPredicateException;
	var ParseCancellationException = Errors.ParseCancellationException;
	var ATNState = __webpack_require__(8).ATNState;
	var Interval = __webpack_require__(10).Interval;
	var IntervalSet = __webpack_require__(10).IntervalSet;

	function ErrorStrategy() {}

	ErrorStrategy.prototype.reset = function (recognizer) {};

	ErrorStrategy.prototype.recoverInline = function (recognizer) {};

	ErrorStrategy.prototype.recover = function (recognizer, e) {};

	ErrorStrategy.prototype.sync = function (recognizer) {};

	ErrorStrategy.prototype.inErrorRecoveryMode = function (recognizer) {};

	ErrorStrategy.prototype.reportError = function (recognizer) {};

	// This is the default implementation of {@link ANTLRErrorStrategy} used for
	// error reporting and recovery in ANTLR parsers.
	//
	function DefaultErrorStrategy() {
	    ErrorStrategy.call(this);
	    // Indicates whether the error strategy is currently "recovering from an
	    // error". This is used to suppress reporting multiple error messages while
	    // attempting to recover from a detected syntax error.
	    //
	    // @see //inErrorRecoveryMode
	    //
	    this.errorRecoveryMode = false;

	    // The index into the input stream where the last error occurred.
	    // This is used to prevent infinite loops where an error is found
	    // but no token is consumed during recovery...another error is found,
	    // ad nauseum. This is a failsafe mechanism to guarantee that at least
	    // one token/tree node is consumed for two errors.
	    //
	    this.lastErrorIndex = -1;
	    this.lastErrorStates = null;
	    return this;
	}

	DefaultErrorStrategy.prototype = Object.create(ErrorStrategy.prototype);
	DefaultErrorStrategy.prototype.constructor = DefaultErrorStrategy;

	// <p>The default implementation simply calls {@link //endErrorCondition} to
	// ensure that the handler is not in error recovery mode.</p>
	DefaultErrorStrategy.prototype.reset = function (recognizer) {
	    this.endErrorCondition(recognizer);
	};

	//
	// This method is called to enter error recovery mode when a recognition
	// exception is reported.
	//
	// @param recognizer the parser instance
	//
	DefaultErrorStrategy.prototype.beginErrorCondition = function (recognizer) {
	    this.errorRecoveryMode = true;
	};

	DefaultErrorStrategy.prototype.inErrorRecoveryMode = function (recognizer) {
	    return this.errorRecoveryMode;
	};

	//
	// This method is called to leave error recovery mode after recovering from
	// a recognition exception.
	//
	// @param recognizer
	//
	DefaultErrorStrategy.prototype.endErrorCondition = function (recognizer) {
	    this.errorRecoveryMode = false;
	    this.lastErrorStates = null;
	    this.lastErrorIndex = -1;
	};

	//
	// {@inheritDoc}
	//
	// <p>The default implementation simply calls {@link //endErrorCondition}.</p>
	//
	DefaultErrorStrategy.prototype.reportMatch = function (recognizer) {
	    this.endErrorCondition(recognizer);
	};

	//
	// {@inheritDoc}
	//
	// <p>The default implementation returns immediately if the handler is already
	// in error recovery mode. Otherwise, it calls {@link //beginErrorCondition}
	// and dispatches the reporting task based on the runtime type of {@code e}
	// according to the following table.</p>
	//
	// <ul>
	// <li>{@link NoViableAltException}: Dispatches the call to
	// {@link //reportNoViableAlternative}</li>
	// <li>{@link InputMismatchException}: Dispatches the call to
	// {@link //reportInputMismatch}</li>
	// <li>{@link FailedPredicateException}: Dispatches the call to
	// {@link //reportFailedPredicate}</li>
	// <li>All other types: calls {@link Parser//notifyErrorListeners} to report
	// the exception</li>
	// </ul>
	//
	DefaultErrorStrategy.prototype.reportError = function (recognizer, e) {
	    // if we've already reported an error and have not matched a token
	    // yet successfully, don't report any errors.
	    if (this.inErrorRecoveryMode(recognizer)) {
	        return; // don't report spurious errors
	    }
	    this.beginErrorCondition(recognizer);
	    if (e instanceof NoViableAltException) {
	        this.reportNoViableAlternative(recognizer, e);
	    } else if (e instanceof InputMismatchException) {
	        this.reportInputMismatch(recognizer, e);
	    } else if (e instanceof FailedPredicateException) {
	        this.reportFailedPredicate(recognizer, e);
	    } else {
	        console.log("unknown recognition error type: " + e.constructor.name);
	        console.log(e.stack);
	        recognizer.notifyErrorListeners(e.getOffendingToken(), e.getMessage(), e);
	    }
	};
	//
	// {@inheritDoc}
	//
	// <p>The default implementation resynchronizes the parser by consuming tokens
	// until we find one in the resynchronization set--loosely the set of tokens
	// that can follow the current rule.</p>
	//
	DefaultErrorStrategy.prototype.recover = function (recognizer, e) {
	    if (this.lastErrorIndex === recognizer.getInputStream().index && this.lastErrorStates !== null && this.lastErrorStates.indexOf(recognizer.state) >= 0) {
	        // uh oh, another error at same token index and previously-visited
	        // state in ATN; must be a case where LT(1) is in the recovery
	        // token set so nothing got consumed. Consume a single token
	        // at least to prevent an infinite loop; this is a failsafe.
	        recognizer.consume();
	    }
	    this.lastErrorIndex = recognizer._input.index;
	    if (this.lastErrorStates === null) {
	        this.lastErrorStates = [];
	    }
	    this.lastErrorStates.push(recognizer.state);
	    var followSet = this.getErrorRecoverySet(recognizer);
	    this.consumeUntil(recognizer, followSet);
	};

	// The default implementation of {@link ANTLRErrorStrategy//sync} makes sure
	// that the current lookahead symbol is consistent with what were expecting
	// at this point in the ATN. You can call this anytime but ANTLR only
	// generates code to check before subrules/loops and each iteration.
	//
	// <p>Implements Jim Idle's magic sync mechanism in closures and optional
	// subrules. E.g.,</p>
	//
	// <pre>
	// a : sync ( stuff sync )* ;
	// sync : {consume to what can follow sync} ;
	// </pre>
	//
	// At the start of a sub rule upon error, {@link //sync} performs single
	// token deletion, if possible. If it can't do that, it bails on the current
	// rule and uses the default error recovery, which consumes until the
	// resynchronization set of the current rule.
	//
	// <p>If the sub rule is optional ({@code (...)?}, {@code (...)*}, or block
	// with an empty alternative), then the expected set includes what follows
	// the subrule.</p>
	//
	// <p>During loop iteration, it consumes until it sees a token that can start a
	// sub rule or what follows loop. Yes, that is pretty aggressive. We opt to
	// stay in the loop as long as possible.</p>
	//
	// <p><strong>ORIGINS</strong></p>
	//
	// <p>Previous versions of ANTLR did a poor job of their recovery within loops.
	// A single mismatch token or missing token would force the parser to bail
	// out of the entire rules surrounding the loop. So, for rule</p>
	//
	// <pre>
	// classDef : 'class' ID '{' member* '}'
	// </pre>
	//
	// input with an extra token between members would force the parser to
	// consume until it found the next class definition rather than the next
	// member definition of the current class.
	//
	// <p>This functionality cost a little bit of effort because the parser has to
	// compare token set at the start of the loop and at each iteration. If for
	// some reason speed is suffering for you, you can turn off this
	// functionality by simply overriding this method as a blank { }.</p>
	//
	DefaultErrorStrategy.prototype.sync = function (recognizer) {
	    // If already recovering, don't try to sync
	    if (this.inErrorRecoveryMode(recognizer)) {
	        return;
	    }
	    var s = recognizer._interp.atn.states[recognizer.state];
	    var la = recognizer.getTokenStream().LA(1);
	    // try cheaper subset first; might get lucky. seems to shave a wee bit off
	    var nextTokens = recognizer.atn.nextTokens(s);
	    if (nextTokens.contains(Token.EPSILON) || nextTokens.contains(la)) {
	        return;
	    }
	    switch (s.stateType) {
	        case ATNState.BLOCK_START:
	        case ATNState.STAR_BLOCK_START:
	        case ATNState.PLUS_BLOCK_START:
	        case ATNState.STAR_LOOP_ENTRY:
	            // report error and recover if possible
	            if (this.singleTokenDeletion(recognizer) !== null) {
	                return;
	            } else {
	                throw new InputMismatchException(recognizer);
	            }
	            break;
	        case ATNState.PLUS_LOOP_BACK:
	        case ATNState.STAR_LOOP_BACK:
	            this.reportUnwantedToken(recognizer);
	            var expecting = new IntervalSet();
	            expecting.addSet(recognizer.getExpectedTokens());
	            var whatFollowsLoopIterationOrRule = expecting.addSet(this.getErrorRecoverySet(recognizer));
	            this.consumeUntil(recognizer, whatFollowsLoopIterationOrRule);
	            break;
	        default:
	        // do nothing if we can't identify the exact kind of ATN state
	    }
	};

	// This is called by {@link //reportError} when the exception is a
	// {@link NoViableAltException}.
	//
	// @see //reportError
	//
	// @param recognizer the parser instance
	// @param e the recognition exception
	//
	DefaultErrorStrategy.prototype.reportNoViableAlternative = function (recognizer, e) {
	    var tokens = recognizer.getTokenStream();
	    var input;
	    if (tokens !== null) {
	        if (e.startToken.type === Token.EOF) {
	            input = "<EOF>";
	        } else {
	            input = tokens.getText(new Interval(e.startToken.tokenIndex, e.offendingToken.tokenIndex));
	        }
	    } else {
	        input = "<unknown input>";
	    }
	    var msg = "no viable alternative at input " + this.escapeWSAndQuote(input);
	    recognizer.notifyErrorListeners(msg, e.offendingToken, e);
	};

	//
	// This is called by {@link //reportError} when the exception is an
	// {@link InputMismatchException}.
	//
	// @see //reportError
	//
	// @param recognizer the parser instance
	// @param e the recognition exception
	//
	DefaultErrorStrategy.prototype.reportInputMismatch = function (recognizer, e) {
	    var msg = "mismatched input " + this.getTokenErrorDisplay(e.offendingToken) + " expecting " + e.getExpectedTokens().toString(recognizer.literalNames, recognizer.symbolicNames);
	    recognizer.notifyErrorListeners(msg, e.offendingToken, e);
	};

	//
	// This is called by {@link //reportError} when the exception is a
	// {@link FailedPredicateException}.
	//
	// @see //reportError
	//
	// @param recognizer the parser instance
	// @param e the recognition exception
	//
	DefaultErrorStrategy.prototype.reportFailedPredicate = function (recognizer, e) {
	    var ruleName = recognizer.ruleNames[recognizer._ctx.ruleIndex];
	    var msg = "rule " + ruleName + " " + e.message;
	    recognizer.notifyErrorListeners(msg, e.offendingToken, e);
	};

	// This method is called to report a syntax error which requires the removal
	// of a token from the input stream. At the time this method is called, the
	// erroneous symbol is current {@code LT(1)} symbol and has not yet been
	// removed from the input stream. When this method returns,
	// {@code recognizer} is in error recovery mode.
	//
	// <p>This method is called when {@link //singleTokenDeletion} identifies
	// single-token deletion as a viable recovery strategy for a mismatched
	// input error.</p>
	//
	// <p>The default implementation simply returns if the handler is already in
	// error recovery mode. Otherwise, it calls {@link //beginErrorCondition} to
	// enter error recovery mode, followed by calling
	// {@link Parser//notifyErrorListeners}.</p>
	//
	// @param recognizer the parser instance
	//
	DefaultErrorStrategy.prototype.reportUnwantedToken = function (recognizer) {
	    if (this.inErrorRecoveryMode(recognizer)) {
	        return;
	    }
	    this.beginErrorCondition(recognizer);
	    var t = recognizer.getCurrentToken();
	    var tokenName = this.getTokenErrorDisplay(t);
	    var expecting = this.getExpectedTokens(recognizer);
	    var msg = "extraneous input " + tokenName + " expecting " + expecting.toString(recognizer.literalNames, recognizer.symbolicNames);
	    recognizer.notifyErrorListeners(msg, t, null);
	};
	// This method is called to report a syntax error which requires the
	// insertion of a missing token into the input stream. At the time this
	// method is called, the missing token has not yet been inserted. When this
	// method returns, {@code recognizer} is in error recovery mode.
	//
	// <p>This method is called when {@link //singleTokenInsertion} identifies
	// single-token insertion as a viable recovery strategy for a mismatched
	// input error.</p>
	//
	// <p>The default implementation simply returns if the handler is already in
	// error recovery mode. Otherwise, it calls {@link //beginErrorCondition} to
	// enter error recovery mode, followed by calling
	// {@link Parser//notifyErrorListeners}.</p>
	//
	// @param recognizer the parser instance
	//
	DefaultErrorStrategy.prototype.reportMissingToken = function (recognizer) {
	    if (this.inErrorRecoveryMode(recognizer)) {
	        return;
	    }
	    this.beginErrorCondition(recognizer);
	    var t = recognizer.getCurrentToken();
	    var expecting = this.getExpectedTokens(recognizer);
	    var msg = "missing " + expecting.toString(recognizer.literalNames, recognizer.symbolicNames) + " at " + this.getTokenErrorDisplay(t);
	    recognizer.notifyErrorListeners(msg, t, null);
	};

	// <p>The default implementation attempts to recover from the mismatched input
	// by using single token insertion and deletion as described below. If the
	// recovery attempt fails, this method throws an
	// {@link InputMismatchException}.</p>
	//
	// <p><strong>EXTRA TOKEN</strong> (single token deletion)</p>
	//
	// <p>{@code LA(1)} is not what we are looking for. If {@code LA(2)} has the
	// right token, however, then assume {@code LA(1)} is some extra spurious
	// token and delete it. Then consume and return the next token (which was
	// the {@code LA(2)} token) as the successful result of the match operation.</p>
	//
	// <p>This recovery strategy is implemented by {@link
	// //singleTokenDeletion}.</p>
	//
	// <p><strong>MISSING TOKEN</strong> (single token insertion)</p>
	//
	// <p>If current token (at {@code LA(1)}) is consistent with what could come
	// after the expected {@code LA(1)} token, then assume the token is missing
	// and use the parser's {@link TokenFactory} to create it on the fly. The
	// "insertion" is performed by returning the created token as the successful
	// result of the match operation.</p>
	//
	// <p>This recovery strategy is implemented by {@link
	// //singleTokenInsertion}.</p>
	//
	// <p><strong>EXAMPLE</strong></p>
	//
	// <p>For example, Input {@code i=(3;} is clearly missing the {@code ')'}. When
	// the parser returns from the nested call to {@code expr}, it will have
	// call chain:</p>
	//
	// <pre>
	// stat &rarr; expr &rarr; atom
	// </pre>
	//
	// and it will be trying to match the {@code ')'} at this point in the
	// derivation:
	//
	// <pre>
	// =&gt; ID '=' '(' INT ')' ('+' atom)* ';'
	// ^
	// </pre>
	//
	// The attempt to match {@code ')'} will fail when it sees {@code ';'} and
	// call {@link //recoverInline}. To recover, it sees that {@code LA(1)==';'}
	// is in the set of tokens that can follow the {@code ')'} token reference
	// in rule {@code atom}. It can assume that you forgot the {@code ')'}.
	//
	DefaultErrorStrategy.prototype.recoverInline = function (recognizer) {
	    // SINGLE TOKEN DELETION
	    var matchedSymbol = this.singleTokenDeletion(recognizer);
	    if (matchedSymbol !== null) {
	        // we have deleted the extra token.
	        // now, move past ttype token as if all were ok
	        recognizer.consume();
	        return matchedSymbol;
	    }
	    // SINGLE TOKEN INSERTION
	    if (this.singleTokenInsertion(recognizer)) {
	        return this.getMissingSymbol(recognizer);
	    }
	    // even that didn't work; must throw the exception
	    throw new InputMismatchException(recognizer);
	};

	//
	// This method implements the single-token insertion inline error recovery
	// strategy. It is called by {@link //recoverInline} if the single-token
	// deletion strategy fails to recover from the mismatched input. If this
	// method returns {@code true}, {@code recognizer} will be in error recovery
	// mode.
	//
	// <p>This method determines whether or not single-token insertion is viable by
	// checking if the {@code LA(1)} input symbol could be successfully matched
	// if it were instead the {@code LA(2)} symbol. If this method returns
	// {@code true}, the caller is responsible for creating and inserting a
	// token with the correct type to produce this behavior.</p>
	//
	// @param recognizer the parser instance
	// @return {@code true} if single-token insertion is a viable recovery
	// strategy for the current mismatched input, otherwise {@code false}
	//
	DefaultErrorStrategy.prototype.singleTokenInsertion = function (recognizer) {
	    var currentSymbolType = recognizer.getTokenStream().LA(1);
	    // if current token is consistent with what could come after current
	    // ATN state, then we know we're missing a token; error recovery
	    // is free to conjure up and insert the missing token
	    var atn = recognizer._interp.atn;
	    var currentState = atn.states[recognizer.state];
	    var next = currentState.transitions[0].target;
	    var expectingAtLL2 = atn.nextTokens(next, recognizer._ctx);
	    if (expectingAtLL2.contains(currentSymbolType)) {
	        this.reportMissingToken(recognizer);
	        return true;
	    } else {
	        return false;
	    }
	};

	// This method implements the single-token deletion inline error recovery
	// strategy. It is called by {@link //recoverInline} to attempt to recover
	// from mismatched input. If this method returns null, the parser and error
	// handler state will not have changed. If this method returns non-null,
	// {@code recognizer} will <em>not</em> be in error recovery mode since the
	// returned token was a successful match.
	//
	// <p>If the single-token deletion is successful, this method calls
	// {@link //reportUnwantedToken} to report the error, followed by
	// {@link Parser//consume} to actually "delete" the extraneous token. Then,
	// before returning {@link //reportMatch} is called to signal a successful
	// match.</p>
	//
	// @param recognizer the parser instance
	// @return the successfully matched {@link Token} instance if single-token
	// deletion successfully recovers from the mismatched input, otherwise
	// {@code null}
	//
	DefaultErrorStrategy.prototype.singleTokenDeletion = function (recognizer) {
	    var nextTokenType = recognizer.getTokenStream().LA(2);
	    var expecting = this.getExpectedTokens(recognizer);
	    if (expecting.contains(nextTokenType)) {
	        this.reportUnwantedToken(recognizer);
	        // print("recoverFromMismatchedToken deleting " \
	        // + str(recognizer.getTokenStream().LT(1)) \
	        // + " since " + str(recognizer.getTokenStream().LT(2)) \
	        // + " is what we want", file=sys.stderr)
	        recognizer.consume(); // simply delete extra token
	        // we want to return the token we're actually matching
	        var matchedSymbol = recognizer.getCurrentToken();
	        this.reportMatch(recognizer); // we know current token is correct
	        return matchedSymbol;
	    } else {
	        return null;
	    }
	};

	// Conjure up a missing token during error recovery.
	//
	// The recognizer attempts to recover from single missing
	// symbols. But, actions might refer to that missing symbol.
	// For example, x=ID {f($x);}. The action clearly assumes
	// that there has been an identifier matched previously and that
	// $x points at that token. If that token is missing, but
	// the next token in the stream is what we want we assume that
	// this token is missing and we keep going. Because we
	// have to return some token to replace the missing token,
	// we have to conjure one up. This method gives the user control
	// over the tokens returned for missing tokens. Mostly,
	// you will want to create something special for identifier
	// tokens. For literals such as '{' and ',', the default
	// action in the parser or tree parser works. It simply creates
	// a CommonToken of the appropriate type. The text will be the token.
	// If you change what tokens must be created by the lexer,
	// override this method to create the appropriate tokens.
	//
	DefaultErrorStrategy.prototype.getMissingSymbol = function (recognizer) {
	    var currentSymbol = recognizer.getCurrentToken();
	    var expecting = this.getExpectedTokens(recognizer);
	    var expectedTokenType = expecting.first(); // get any element
	    var tokenText;
	    if (expectedTokenType === Token.EOF) {
	        tokenText = "<missing EOF>";
	    } else {
	        tokenText = "<missing " + recognizer.literalNames[expectedTokenType] + ">";
	    }
	    var current = currentSymbol;
	    var lookback = recognizer.getTokenStream().LT(-1);
	    if (current.type === Token.EOF && lookback !== null) {
	        current = lookback;
	    }
	    return recognizer.getTokenFactory().create(current.source, expectedTokenType, tokenText, Token.DEFAULT_CHANNEL, -1, -1, current.line, current.column);
	};

	DefaultErrorStrategy.prototype.getExpectedTokens = function (recognizer) {
	    return recognizer.getExpectedTokens();
	};

	// How should a token be displayed in an error message? The default
	// is to display just the text, but during development you might
	// want to have a lot of information spit out. Override in that case
	// to use t.toString() (which, for CommonToken, dumps everything about
	// the token). This is better than forcing you to override a method in
	// your token objects because you don't have to go modify your lexer
	// so that it creates a new Java type.
	//
	DefaultErrorStrategy.prototype.getTokenErrorDisplay = function (t) {
	    if (t === null) {
	        return "<no token>";
	    }
	    var s = t.text;
	    if (s === null) {
	        if (t.type === Token.EOF) {
	            s = "<EOF>";
	        } else {
	            s = "<" + t.type + ">";
	        }
	    }
	    return this.escapeWSAndQuote(s);
	};

	DefaultErrorStrategy.prototype.escapeWSAndQuote = function (s) {
	    s = s.replace(/\n/g, "\\n");
	    s = s.replace(/\r/g, "\\r");
	    s = s.replace(/\t/g, "\\t");
	    return "'" + s + "'";
	};

	// Compute the error recovery set for the current rule. During
	// rule invocation, the parser pushes the set of tokens that can
	// follow that rule reference on the stack; this amounts to
	// computing FIRST of what follows the rule reference in the
	// enclosing rule. See LinearApproximator.FIRST().
	// This local follow set only includes tokens
	// from within the rule; i.e., the FIRST computation done by
	// ANTLR stops at the end of a rule.
	//
	// EXAMPLE
	//
	// When you find a "no viable alt exception", the input is not
	// consistent with any of the alternatives for rule r. The best
	// thing to do is to consume tokens until you see something that
	// can legally follow a call to r//or* any rule that called r.
	// You don't want the exact set of viable next tokens because the
	// input might just be missing a token--you might consume the
	// rest of the input looking for one of the missing tokens.
	//
	// Consider grammar:
	//
	// a : '[' b ']'
	// | '(' b ')'
	// ;
	// b : c '^' INT ;
	// c : ID
	// | INT
	// ;
	//
	// At each rule invocation, the set of tokens that could follow
	// that rule is pushed on a stack. Here are the various
	// context-sensitive follow sets:
	//
	// FOLLOW(b1_in_a) = FIRST(']') = ']'
	// FOLLOW(b2_in_a) = FIRST(')') = ')'
	// FOLLOW(c_in_b) = FIRST('^') = '^'
	//
	// Upon erroneous input "[]", the call chain is
	//
	// a -> b -> c
	//
	// and, hence, the follow context stack is:
	//
	// depth follow set start of rule execution
	// 0 <EOF> a (from main())
	// 1 ']' b
	// 2 '^' c
	//
	// Notice that ')' is not included, because b would have to have
	// been called from a different context in rule a for ')' to be
	// included.
	//
	// For error recovery, we cannot consider FOLLOW(c)
	// (context-sensitive or otherwise). We need the combined set of
	// all context-sensitive FOLLOW sets--the set of all tokens that
	// could follow any reference in the call chain. We need to
	// resync to one of those tokens. Note that FOLLOW(c)='^' and if
	// we resync'd to that token, we'd consume until EOF. We need to
	// sync to context-sensitive FOLLOWs for a, b, and c: {']','^'}.
	// In this case, for input "[]", LA(1) is ']' and in the set, so we would
	// not consume anything. After printing an error, rule c would
	// return normally. Rule b would not find the required '^' though.
	// At this point, it gets a mismatched token error and throws an
	// exception (since LA(1) is not in the viable following token
	// set). The rule exception handler tries to recover, but finds
	// the same recovery set and doesn't consume anything. Rule b
	// exits normally returning to rule a. Now it finds the ']' (and
	// with the successful match exits errorRecovery mode).
	//
	// So, you can see that the parser walks up the call chain looking
	// for the token that was a member of the recovery set.
	//
	// Errors are not generated in errorRecovery mode.
	//
	// ANTLR's error recovery mechanism is based upon original ideas:
	//
	// "Algorithms + Data Structures = Programs" by Niklaus Wirth
	//
	// and
	//
	// "A note on error recovery in recursive descent parsers":
	// http://portal.acm.org/citation.cfm?id=947902.947905
	//
	// Later, Josef Grosch had some good ideas:
	//
	// "Efficient and Comfortable Error Recovery in Recursive Descent
	// Parsers":
	// ftp://www.cocolab.com/products/cocktail/doca4.ps/ell.ps.zip
	//
	// Like Grosch I implement context-sensitive FOLLOW sets that are combined
	// at run-time upon error to avoid overhead during parsing.
	//
	DefaultErrorStrategy.prototype.getErrorRecoverySet = function (recognizer) {
	    var atn = recognizer._interp.atn;
	    var ctx = recognizer._ctx;
	    var recoverSet = new IntervalSet();
	    while (ctx !== null && ctx.invokingState >= 0) {
	        // compute what follows who invoked us
	        var invokingState = atn.states[ctx.invokingState];
	        var rt = invokingState.transitions[0];
	        var follow = atn.nextTokens(rt.followState);
	        recoverSet.addSet(follow);
	        ctx = ctx.parentCtx;
	    }
	    recoverSet.removeOne(Token.EPSILON);
	    return recoverSet;
	};

	// Consume tokens until one matches the given token set.//
	DefaultErrorStrategy.prototype.consumeUntil = function (recognizer, set) {
	    var ttype = recognizer.getTokenStream().LA(1);
	    while (ttype !== Token.EOF && !set.contains(ttype)) {
	        recognizer.consume();
	        ttype = recognizer.getTokenStream().LA(1);
	    }
	};

	//
	// This implementation of {@link ANTLRErrorStrategy} responds to syntax errors
	// by immediately canceling the parse operation with a
	// {@link ParseCancellationException}. The implementation ensures that the
	// {@link ParserRuleContext//exception} field is set for all parse tree nodes
	// that were not completed prior to encountering the error.
	//
	// <p>
	// This error strategy is useful in the following scenarios.</p>
	//
	// <ul>
	// <li><strong>Two-stage parsing:</strong> This error strategy allows the first
	// stage of two-stage parsing to immediately terminate if an error is
	// encountered, and immediately fall back to the second stage. In addition to
	// avoiding wasted work by attempting to recover from errors here, the empty
	// implementation of {@link BailErrorStrategy//sync} improves the performance of
	// the first stage.</li>
	// <li><strong>Silent validation:</strong> When syntax errors are not being
	// reported or logged, and the parse result is simply ignored if errors occur,
	// the {@link BailErrorStrategy} avoids wasting work on recovering from errors
	// when the result will be ignored either way.</li>
	// </ul>
	//
	// <p>
	// {@code myparser.setErrorHandler(new BailErrorStrategy());}</p>
	//
	// @see Parser//setErrorHandler(ANTLRErrorStrategy)
	//
	function BailErrorStrategy() {
	    DefaultErrorStrategy.call(this);
	    return this;
	}

	BailErrorStrategy.prototype = Object.create(DefaultErrorStrategy.prototype);
	BailErrorStrategy.prototype.constructor = BailErrorStrategy;

	// Instead of recovering from exception {@code e}, re-throw it wrapped
	// in a {@link ParseCancellationException} so it is not caught by the
	// rule function catches. Use {@link Exception//getCause()} to get the
	// original {@link RecognitionException}.
	//
	BailErrorStrategy.prototype.recover = function (recognizer, e) {
	    var context = recognizer._ctx;
	    while (context !== null) {
	        context.exception = e;
	        context = context.parentCtx;
	    }
	    throw new ParseCancellationException(e);
	};

	// Make sure we don't attempt to recover inline; if the parser
	// successfully recovers, it won't throw an exception.
	//
	BailErrorStrategy.prototype.recoverInline = function (recognizer) {
	    this.recover(recognizer, new InputMismatchException(recognizer));
	};

	// Make sure we don't attempt to recover from problems in subrules.//
	BailErrorStrategy.prototype.sync = function (recognizer) {
	    // pass
	};

	exports.BailErrorStrategy = BailErrorStrategy;
	exports.DefaultErrorStrategy = DefaultErrorStrategy;

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	var InputStream = __webpack_require__(43).InputStream;

	var isNodeJs = typeof window === 'undefined' && typeof importScripts === 'undefined';
	var fs = isNodeJs ? __webpack_require__(44) : null;

	// Utility functions to create InputStreams from various sources.
	//
	// All returned InputStreams support the full range of Unicode
	// up to U+10FFFF (the default behavior of InputStream only supports
	// code points up to U+FFFF).
	var CharStreams = {
	  // Creates an InputStream from a string.
	  fromString: function fromString(str) {
	    return new InputStream(str, true);
	  },

	  // Asynchronously creates an InputStream from a blob given the
	  // encoding of the bytes in that blob (defaults to 'utf8' if
	  // encoding is null).
	  //
	  // Invokes onLoad(result) on success, onError(error) on
	  // failure.
	  fromBlob: function fromBlob(blob, encoding, onLoad, onError) {
	    var reader = FileReader();
	    reader.onload = function (e) {
	      var is = new InputStream(e.target.result, true);
	      onLoad(is);
	    };
	    reader.onerror = onError;
	    reader.readAsText(blob, encoding);
	  },

	  // Creates an InputStream from a Buffer given the
	  // encoding of the bytes in that buffer (defaults to 'utf8' if
	  // encoding is null).
	  fromBuffer: function fromBuffer(buffer, encoding) {
	    return new InputStream(buffer.toString(encoding), true);
	  },

	  // Asynchronously creates an InputStream from a file on disk given
	  // the encoding of the bytes in that file (defaults to 'utf8' if
	  // encoding is null).
	  //
	  // Invokes callback(error, result) on completion.
	  fromPath: function fromPath(path, encoding, callback) {
	    fs.readFile(path, encoding, function (err, data) {
	      var is = null;
	      if (data !== null) {
	        is = new InputStream(data, true);
	      }
	      callback(err, is);
	    });
	  },

	  // Synchronously creates an InputStream given a path to a file
	  // on disk and the encoding of the bytes in that file (defaults to
	  // 'utf8' if encoding is null).
	  fromPathSync: function fromPathSync(path, encoding) {
	    var data = fs.readFileSync(path, encoding);
	    return new InputStream(data, true);
	  }
	};

	exports.CharStreams = CharStreams;

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	var Token = __webpack_require__(6).Token;
	__webpack_require__(33);
	__webpack_require__(37);

	// Vacuum all input from a string and then treat it like a buffer.

	function _loadString(stream, decodeToUnicodeCodePoints) {
		stream._index = 0;
		stream.data = [];
		if (stream.decodeToUnicodeCodePoints) {
			for (var i = 0; i < stream.strdata.length;) {
				var codePoint = stream.strdata.codePointAt(i);
				stream.data.push(codePoint);
				i += codePoint <= 0xFFFF ? 1 : 2;
			}
		} else {
			for (var i = 0; i < stream.strdata.length; i++) {
				var codeUnit = stream.strdata.charCodeAt(i);
				stream.data.push(codeUnit);
			}
		}
		stream._size = stream.data.length;
	}

	// If decodeToUnicodeCodePoints is true, the input is treated
	// as a series of Unicode code points.
	//
	// Otherwise, the input is treated as a series of 16-bit UTF-16 code
	// units.
	function InputStream(data, decodeToUnicodeCodePoints) {
		this.name = "<empty>";
		this.strdata = data;
		this.decodeToUnicodeCodePoints = decodeToUnicodeCodePoints || false;
		_loadString(this);
		return this;
	}

	Object.defineProperty(InputStream.prototype, "index", {
		get: function get() {
			return this._index;
		}
	});

	Object.defineProperty(InputStream.prototype, "size", {
		get: function get() {
			return this._size;
		}
	});

	// Reset the stream so that it's in the same state it was
	// when the object was created *except* the data array is not
	// touched.
	//
	InputStream.prototype.reset = function () {
		this._index = 0;
	};

	InputStream.prototype.consume = function () {
		if (this._index >= this._size) {
			// assert this.LA(1) == Token.EOF
			throw "cannot consume EOF";
		}
		this._index += 1;
	};

	InputStream.prototype.LA = function (offset) {
		if (offset === 0) {
			return 0; // undefined
		}
		if (offset < 0) {
			offset += 1; // e.g., translate LA(-1) to use offset=0
		}
		var pos = this._index + offset - 1;
		if (pos < 0 || pos >= this._size) {
			// invalid
			return Token.EOF;
		}
		return this.data[pos];
	};

	InputStream.prototype.LT = function (offset) {
		return this.LA(offset);
	};

	// mark/release do nothing; we have entire buffer
	InputStream.prototype.mark = function () {
		return -1;
	};

	InputStream.prototype.release = function (marker) {};

	// consume() ahead until p==_index; can't just set p=_index as we must
	// update line and column. If we seek backwards, just set p
	//
	InputStream.prototype.seek = function (_index) {
		if (_index <= this._index) {
			this._index = _index; // just jump; don't update stream state (line,
			// ...)
			return;
		}
		// seek forward
		this._index = Math.min(_index, this._size);
	};

	InputStream.prototype.getText = function (start, stop) {
		if (stop >= this._size) {
			stop = this._size - 1;
		}
		if (start >= this._size) {
			return "";
		} else {
			if (this.decodeToUnicodeCodePoints) {
				var result = "";
				for (var i = start; i <= stop; i++) {
					result += String.fromCodePoint(this.data[i]);
				}
				return result;
			} else {
				return this.strdata.slice(start, stop + 1);
			}
		}
	};

	InputStream.prototype.toString = function () {
		return this.strdata;
	};

	exports.InputStream = InputStream;

/***/ },
/* 44 */
/***/ function(module, exports) {

	"use strict";

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	//

	//
	//  This is an InputStream that is loaded from a file all at once
	//  when you construct the object.
	//
	var InputStream = __webpack_require__(43).InputStream;
	var isNodeJs = typeof window === 'undefined' && typeof importScripts === 'undefined';
	var fs = isNodeJs ? __webpack_require__(44) : null;

	function FileStream(fileName, decodeToUnicodeCodePoints) {
		var data = fs.readFileSync(fileName, "utf8");
		InputStream.call(this, data, decodeToUnicodeCodePoints);
		this.fileName = fileName;
		return this;
	}

	FileStream.prototype = Object.create(InputStream.prototype);
	FileStream.prototype.constructor = FileStream;

	exports.FileStream = FileStream;

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */
	///

	//
	// This class extends {@link BufferedTokenStream} with functionality to filter
	// token streams to tokens on a particular channel (tokens where
	// {@link Token//getChannel} returns a particular value).
	//
	// <p>
	// This token stream provides access to all tokens by index or when calling
	// methods like {@link //getText}. The channel filtering is only used for code
	// accessing tokens via the lookahead methods {@link //LA}, {@link //LT}, and
	// {@link //LB}.</p>
	//
	// <p>
	// By default, tokens are placed on the default channel
	// ({@link Token//DEFAULT_CHANNEL}), but may be reassigned by using the
	// {@code ->channel(HIDDEN)} lexer command, or by using an embedded action to
	// call {@link Lexer//setChannel}.
	// </p>
	//
	// <p>
	// Note: lexer rules which use the {@code ->skip} lexer command or call
	// {@link Lexer//skip} do not produce tokens at all, so input text matched by
	// such a rule will not be available as part of the token stream, regardless of
	// channel.</p>
	///

	var Token = __webpack_require__(6).Token;
	var BufferedTokenStream = __webpack_require__(47).BufferedTokenStream;

	function CommonTokenStream(lexer, channel) {
	    BufferedTokenStream.call(this, lexer);
	    this.channel = channel === undefined ? Token.DEFAULT_CHANNEL : channel;
	    return this;
	}

	CommonTokenStream.prototype = Object.create(BufferedTokenStream.prototype);
	CommonTokenStream.prototype.constructor = CommonTokenStream;

	CommonTokenStream.prototype.adjustSeekIndex = function (i) {
	    return this.nextTokenOnChannel(i, this.channel);
	};

	CommonTokenStream.prototype.LB = function (k) {
	    if (k === 0 || this.index - k < 0) {
	        return null;
	    }
	    var i = this.index;
	    var n = 1;
	    // find k good tokens looking backwards
	    while (n <= k) {
	        // skip off-channel tokens
	        i = this.previousTokenOnChannel(i - 1, this.channel);
	        n += 1;
	    }
	    if (i < 0) {
	        return null;
	    }
	    return this.tokens[i];
	};

	CommonTokenStream.prototype.LT = function (k) {
	    this.lazyInit();
	    if (k === 0) {
	        return null;
	    }
	    if (k < 0) {
	        return this.LB(-k);
	    }
	    var i = this.index;
	    var n = 1; // we know tokens[pos] is a good one
	    // find k good tokens
	    while (n < k) {
	        // skip off-channel tokens, but make sure to not look past EOF
	        if (this.sync(i + 1)) {
	            i = this.nextTokenOnChannel(i + 1, this.channel);
	        }
	        n += 1;
	    }
	    return this.tokens[i];
	};

	// Count EOF just once.///
	CommonTokenStream.prototype.getNumberOfOnChannelTokens = function () {
	    var n = 0;
	    this.fill();
	    for (var i = 0; i < this.tokens.length; i++) {
	        var t = this.tokens[i];
	        if (t.channel === this.channel) {
	            n += 1;
	        }
	        if (t.type === Token.EOF) {
	            break;
	        }
	    }
	    return n;
	};

	exports.CommonTokenStream = CommonTokenStream;

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//
	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	// This implementation of {@link TokenStream} loads tokens from a
	// {@link TokenSource} on-demand, and places the tokens in a buffer to provide
	// access to any previous token by index.
	//
	// <p>
	// This token stream ignores the value of {@link Token//getChannel}. If your
	// parser requires the token stream filter tokens to only those on a particular
	// channel, such as {@link Token//DEFAULT_CHANNEL} or
	// {@link Token//HIDDEN_CHANNEL}, use a filtering token stream such a
	// {@link CommonTokenStream}.</p>

	var Token = __webpack_require__(6).Token;
	var Lexer = __webpack_require__(22).Lexer;
	var Interval = __webpack_require__(10).Interval;

	// this is just to keep meaningful parameter types to Parser
	function TokenStream() {
		return this;
	}

	function BufferedTokenStream(tokenSource) {

		TokenStream.call(this);
		// The {@link TokenSource} from which tokens for this stream are fetched.
		this.tokenSource = tokenSource;

		// A collection of all tokens fetched from the token source. The list is
		// considered a complete view of the input once {@link //fetchedEOF} is set
		// to {@code true}.
		this.tokens = [];

		// The index into {@link //tokens} of the current token (next token to
		// {@link //consume}). {@link //tokens}{@code [}{@link //p}{@code ]} should
		// be
		// {@link //LT LT(1)}.
		//
		// <p>This field is set to -1 when the stream is first constructed or when
		// {@link //setTokenSource} is called, indicating that the first token has
		// not yet been fetched from the token source. For additional information,
		// see the documentation of {@link IntStream} for a description of
		// Initializing Methods.</p>
		this.index = -1;

		// Indicates whether the {@link Token//EOF} token has been fetched from
		// {@link //tokenSource} and added to {@link //tokens}. This field improves
		// performance for the following cases:
		//
		// <ul>
		// <li>{@link //consume}: The lookahead check in {@link //consume} to
		// prevent
		// consuming the EOF symbol is optimized by checking the values of
		// {@link //fetchedEOF} and {@link //p} instead of calling {@link
		// //LA}.</li>
		// <li>{@link //fetch}: The check to prevent adding multiple EOF symbols
		// into
		// {@link //tokens} is trivial with this field.</li>
		// <ul>
		this.fetchedEOF = false;
		return this;
	}

	BufferedTokenStream.prototype = Object.create(TokenStream.prototype);
	BufferedTokenStream.prototype.constructor = BufferedTokenStream;

	BufferedTokenStream.prototype.mark = function () {
		return 0;
	};

	BufferedTokenStream.prototype.release = function (marker) {
		// no resources to release
	};

	BufferedTokenStream.prototype.reset = function () {
		this.seek(0);
	};

	BufferedTokenStream.prototype.seek = function (index) {
		this.lazyInit();
		this.index = this.adjustSeekIndex(index);
	};

	BufferedTokenStream.prototype.get = function (index) {
		this.lazyInit();
		return this.tokens[index];
	};

	BufferedTokenStream.prototype.consume = function () {
		var skipEofCheck = false;
		if (this.index >= 0) {
			if (this.fetchedEOF) {
				// the last token in tokens is EOF. skip check if p indexes any
				// fetched token except the last.
				skipEofCheck = this.index < this.tokens.length - 1;
			} else {
				// no EOF token in tokens. skip check if p indexes a fetched token.
				skipEofCheck = this.index < this.tokens.length;
			}
		} else {
			// not yet initialized
			skipEofCheck = false;
		}
		if (!skipEofCheck && this.LA(1) === Token.EOF) {
			throw "cannot consume EOF";
		}
		if (this.sync(this.index + 1)) {
			this.index = this.adjustSeekIndex(this.index + 1);
		}
	};

	// Make sure index {@code i} in tokens has a token.
	//
	// @return {@code true} if a token is located at index {@code i}, otherwise
	// {@code false}.
	// @see //get(int i)
	// /
	BufferedTokenStream.prototype.sync = function (i) {
		var n = i - this.tokens.length + 1; // how many more elements we need?
		if (n > 0) {
			var fetched = this.fetch(n);
			return fetched >= n;
		}
		return true;
	};

	// Add {@code n} elements to buffer.
	//
	// @return The actual number of elements added to the buffer.
	// /
	BufferedTokenStream.prototype.fetch = function (n) {
		if (this.fetchedEOF) {
			return 0;
		}
		for (var i = 0; i < n; i++) {
			var t = this.tokenSource.nextToken();
			t.tokenIndex = this.tokens.length;
			this.tokens.push(t);
			if (t.type === Token.EOF) {
				this.fetchedEOF = true;
				return i + 1;
			}
		}
		return n;
	};

	// Get all tokens from start..stop inclusively///
	BufferedTokenStream.prototype.getTokens = function (start, stop, types) {
		if (types === undefined) {
			types = null;
		}
		if (start < 0 || stop < 0) {
			return null;
		}
		this.lazyInit();
		var subset = [];
		if (stop >= this.tokens.length) {
			stop = this.tokens.length - 1;
		}
		for (var i = start; i < stop; i++) {
			var t = this.tokens[i];
			if (t.type === Token.EOF) {
				break;
			}
			if (types === null || types.contains(t.type)) {
				subset.push(t);
			}
		}
		return subset;
	};

	BufferedTokenStream.prototype.LA = function (i) {
		return this.LT(i).type;
	};

	BufferedTokenStream.prototype.LB = function (k) {
		if (this.index - k < 0) {
			return null;
		}
		return this.tokens[this.index - k];
	};

	BufferedTokenStream.prototype.LT = function (k) {
		this.lazyInit();
		if (k === 0) {
			return null;
		}
		if (k < 0) {
			return this.LB(-k);
		}
		var i = this.index + k - 1;
		this.sync(i);
		if (i >= this.tokens.length) {
			// return EOF token
			// EOF must be last token
			return this.tokens[this.tokens.length - 1];
		}
		return this.tokens[i];
	};

	// Allowed derived classes to modify the behavior of operations which change
	// the current stream position by adjusting the target token index of a seek
	// operation. The default implementation simply returns {@code i}. If an
	// exception is thrown in this method, the current stream index should not be
	// changed.
	//
	// <p>For example, {@link CommonTokenStream} overrides this method to ensure
	// that
	// the seek target is always an on-channel token.</p>
	//
	// @param i The target token index.
	// @return The adjusted target token index.

	BufferedTokenStream.prototype.adjustSeekIndex = function (i) {
		return i;
	};

	BufferedTokenStream.prototype.lazyInit = function () {
		if (this.index === -1) {
			this.setup();
		}
	};

	BufferedTokenStream.prototype.setup = function () {
		this.sync(0);
		this.index = this.adjustSeekIndex(0);
	};

	// Reset this token stream by setting its token source.///
	BufferedTokenStream.prototype.setTokenSource = function (tokenSource) {
		this.tokenSource = tokenSource;
		this.tokens = [];
		this.index = -1;
		this.fetchedEOF = false;
	};

	// Given a starting index, return the index of the next token on channel.
	// Return i if tokens[i] is on channel. Return -1 if there are no tokens
	// on channel between i and EOF.
	// /
	BufferedTokenStream.prototype.nextTokenOnChannel = function (i, channel) {
		this.sync(i);
		if (i >= this.tokens.length) {
			return -1;
		}
		var token = this.tokens[i];
		while (token.channel !== this.channel) {
			if (token.type === Token.EOF) {
				return -1;
			}
			i += 1;
			this.sync(i);
			token = this.tokens[i];
		}
		return i;
	};

	// Given a starting index, return the index of the previous token on channel.
	// Return i if tokens[i] is on channel. Return -1 if there are no tokens
	// on channel between i and 0.
	BufferedTokenStream.prototype.previousTokenOnChannel = function (i, channel) {
		while (i >= 0 && this.tokens[i].channel !== channel) {
			i -= 1;
		}
		return i;
	};

	// Collect all tokens on specified channel to the right of
	// the current token up until we see a token on DEFAULT_TOKEN_CHANNEL or
	// EOF. If channel is -1, find any non default channel token.
	BufferedTokenStream.prototype.getHiddenTokensToRight = function (tokenIndex, channel) {
		if (channel === undefined) {
			channel = -1;
		}
		this.lazyInit();
		if (tokenIndex < 0 || tokenIndex >= this.tokens.length) {
			throw "" + tokenIndex + " not in 0.." + this.tokens.length - 1;
		}
		var nextOnChannel = this.nextTokenOnChannel(tokenIndex + 1, Lexer.DEFAULT_TOKEN_CHANNEL);
		var from_ = tokenIndex + 1;
		// if none onchannel to right, nextOnChannel=-1 so set to = last token
		var to = nextOnChannel === -1 ? this.tokens.length - 1 : nextOnChannel;
		return this.filterForChannel(from_, to, channel);
	};

	// Collect all tokens on specified channel to the left of
	// the current token up until we see a token on DEFAULT_TOKEN_CHANNEL.
	// If channel is -1, find any non default channel token.
	BufferedTokenStream.prototype.getHiddenTokensToLeft = function (tokenIndex, channel) {
		if (channel === undefined) {
			channel = -1;
		}
		this.lazyInit();
		if (tokenIndex < 0 || tokenIndex >= this.tokens.length) {
			throw "" + tokenIndex + " not in 0.." + this.tokens.length - 1;
		}
		var prevOnChannel = this.previousTokenOnChannel(tokenIndex - 1, Lexer.DEFAULT_TOKEN_CHANNEL);
		if (prevOnChannel === tokenIndex - 1) {
			return null;
		}
		// if none on channel to left, prevOnChannel=-1 then from=0
		var from_ = prevOnChannel + 1;
		var to = tokenIndex - 1;
		return this.filterForChannel(from_, to, channel);
	};

	BufferedTokenStream.prototype.filterForChannel = function (left, right, channel) {
		var hidden = [];
		for (var i = left; i < right + 1; i++) {
			var t = this.tokens[i];
			if (channel === -1) {
				if (t.channel !== Lexer.DEFAULT_TOKEN_CHANNEL) {
					hidden.push(t);
				}
			} else if (t.channel === channel) {
				hidden.push(t);
			}
		}
		if (hidden.length === 0) {
			return null;
		}
		return hidden;
	};

	BufferedTokenStream.prototype.getSourceName = function () {
		return this.tokenSource.getSourceName();
	};

	// Get the text of all tokens in this buffer.///
	BufferedTokenStream.prototype.getText = function (interval) {
		this.lazyInit();
		this.fill();
		if (interval === undefined || interval === null) {
			interval = new Interval(0, this.tokens.length - 1);
		}
		var start = interval.start;
		if (start instanceof Token) {
			start = start.tokenIndex;
		}
		var stop = interval.stop;
		if (stop instanceof Token) {
			stop = stop.tokenIndex;
		}
		if (start === null || stop === null || start < 0 || stop < 0) {
			return "";
		}
		if (stop >= this.tokens.length) {
			stop = this.tokens.length - 1;
		}
		var s = "";
		for (var i = start; i < stop + 1; i++) {
			var t = this.tokens[i];
			if (t.type === Token.EOF) {
				break;
			}
			s = s + t.text;
		}
		return s;
	};

	// Get all tokens from lexer until EOF///
	BufferedTokenStream.prototype.fill = function () {
		this.lazyInit();
		while (this.fetch(1000) === 1000) {
			continue;
		}
	};

	exports.BufferedTokenStream = BufferedTokenStream;

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
	 * Use of this file is governed by the BSD 3-clause license that
	 * can be found in the LICENSE.txt file in the project root.
	 */

	var Token = __webpack_require__(6).Token;
	var ParseTreeListener = __webpack_require__(14).ParseTreeListener;
	var Recognizer = __webpack_require__(23).Recognizer;
	var DefaultErrorStrategy = __webpack_require__(41).DefaultErrorStrategy;
	var ATNDeserializer = __webpack_require__(17).ATNDeserializer;
	var ATNDeserializationOptions = __webpack_require__(19).ATNDeserializationOptions;
	var TerminalNode = __webpack_require__(14).TerminalNode;
	var ErrorNode = __webpack_require__(14).ErrorNode;

	function TraceListener(parser) {
		ParseTreeListener.call(this);
		this.parser = parser;
		return this;
	}

	TraceListener.prototype = Object.create(ParseTreeListener.prototype);
	TraceListener.prototype.constructor = TraceListener;

	TraceListener.prototype.enterEveryRule = function (ctx) {
		console.log("enter   " + this.parser.ruleNames[ctx.ruleIndex] + ", LT(1)=" + this.parser._input.LT(1).text);
	};

	TraceListener.prototype.visitTerminal = function (node) {
		console.log("consume " + node.symbol + " rule " + this.parser.ruleNames[this.parser._ctx.ruleIndex]);
	};

	TraceListener.prototype.exitEveryRule = function (ctx) {
		console.log("exit    " + this.parser.ruleNames[ctx.ruleIndex] + ", LT(1)=" + this.parser._input.LT(1).text);
	};

	// this is all the parsing support code essentially; most of it is error
	// recovery stuff.//
	function Parser(input) {
		Recognizer.call(this);
		// The input stream.
		this._input = null;
		// The error handling strategy for the parser. The default value is a new
		// instance of {@link DefaultErrorStrategy}.
		this._errHandler = new DefaultErrorStrategy();
		this._precedenceStack = [];
		this._precedenceStack.push(0);
		// The {@link ParserRuleContext} object for the currently executing rule.
		// this is always non-null during the parsing process.
		this._ctx = null;
		// Specifies whether or not the parser should construct a parse tree during
		// the parsing process. The default value is {@code true}.
		this.buildParseTrees = true;
		// When {@link //setTrace}{@code (true)} is called, a reference to the
		// {@link TraceListener} is stored here so it can be easily removed in a
		// later call to {@link //setTrace}{@code (false)}. The listener itself is
		// implemented as a parser listener so this field is not directly used by
		// other parser methods.
		this._tracer = null;
		// The list of {@link ParseTreeListener} listeners registered to receive
		// events during the parse.
		this._parseListeners = null;
		// The number of syntax errors reported during parsing. this value is
		// incremented each time {@link //notifyErrorListeners} is called.
		this._syntaxErrors = 0;
		this.setInputStream(input);
		return this;
	}

	Parser.prototype = Object.create(Recognizer.prototype);
	Parser.prototype.contructor = Parser;

	// this field maps from the serialized ATN string to the deserialized {@link
	// ATN} with
	// bypass alternatives.
	//
	// @see ATNDeserializationOptions//isGenerateRuleBypassTransitions()
	//
	Parser.bypassAltsAtnCache = {};

	// reset the parser's state//
	Parser.prototype.reset = function () {
		if (this._input !== null) {
			this._input.seek(0);
		}
		this._errHandler.reset(this);
		this._ctx = null;
		this._syntaxErrors = 0;
		this.setTrace(false);
		this._precedenceStack = [];
		this._precedenceStack.push(0);
		if (this._interp !== null) {
			this._interp.reset();
		}
	};

	// Match current input symbol against {@code ttype}. If the symbol type
	// matches, {@link ANTLRErrorStrategy//reportMatch} and {@link //consume} are
	// called to complete the match process.
	//
	// <p>If the symbol type does not match,
	// {@link ANTLRErrorStrategy//recoverInline} is called on the current error
	// strategy to attempt recovery. If {@link //getBuildParseTree} is
	// {@code true} and the token index of the symbol returned by
	// {@link ANTLRErrorStrategy//recoverInline} is -1, the symbol is added to
	// the parse tree by calling {@link ParserRuleContext//addErrorNode}.</p>
	//
	// @param ttype the token type to match
	// @return the matched symbol
	// @throws RecognitionException if the current input symbol did not match
	// {@code ttype} and the error strategy could not recover from the
	// mismatched symbol

	Parser.prototype.match = function (ttype) {
		var t = this.getCurrentToken();
		if (t.type === ttype) {
			this._errHandler.reportMatch(this);
			this.consume();
		} else {
			t = this._errHandler.recoverInline(this);
			if (this.buildParseTrees && t.tokenIndex === -1) {
				// we must have conjured up a new token during single token
				// insertion
				// if it's not the current symbol
				this._ctx.addErrorNode(t);
			}
		}
		return t;
	};
	// Match current input symbol as a wildcard. If the symbol type matches
	// (i.e. has a value greater than 0), {@link ANTLRErrorStrategy//reportMatch}
	// and {@link //consume} are called to complete the match process.
	//
	// <p>If the symbol type does not match,
	// {@link ANTLRErrorStrategy//recoverInline} is called on the current error
	// strategy to attempt recovery. If {@link //getBuildParseTree} is
	// {@code true} and the token index of the symbol returned by
	// {@link ANTLRErrorStrategy//recoverInline} is -1, the symbol is added to
	// the parse tree by calling {@link ParserRuleContext//addErrorNode}.</p>
	//
	// @return the matched symbol
	// @throws RecognitionException if the current input symbol did not match
	// a wildcard and the error strategy could not recover from the mismatched
	// symbol

	Parser.prototype.matchWildcard = function () {
		var t = this.getCurrentToken();
		if (t.type > 0) {
			this._errHandler.reportMatch(this);
			this.consume();
		} else {
			t = this._errHandler.recoverInline(this);
			if (this._buildParseTrees && t.tokenIndex === -1) {
				// we must have conjured up a new token during single token
				// insertion
				// if it's not the current symbol
				this._ctx.addErrorNode(t);
			}
		}
		return t;
	};

	Parser.prototype.getParseListeners = function () {
		return this._parseListeners || [];
	};

	// Registers {@code listener} to receive events during the parsing process.
	//
	// <p>To support output-preserving grammar transformations (including but not
	// limited to left-recursion removal, automated left-factoring, and
	// optimized code generation), calls to listener methods during the parse
	// may differ substantially from calls made by
	// {@link ParseTreeWalker//DEFAULT} used after the parse is complete. In
	// particular, rule entry and exit events may occur in a different order
	// during the parse than after the parser. In addition, calls to certain
	// rule entry methods may be omitted.</p>
	//
	// <p>With the following specific exceptions, calls to listener events are
	// <em>deterministic</em>, i.e. for identical input the calls to listener
	// methods will be the same.</p>
	//
	// <ul>
	// <li>Alterations to the grammar used to generate code may change the
	// behavior of the listener calls.</li>
	// <li>Alterations to the command line options passed to ANTLR 4 when
	// generating the parser may change the behavior of the listener calls.</li>
	// <li>Changing the version of the ANTLR Tool used to generate the parser
	// may change the behavior of the listener calls.</li>
	// </ul>
	//
	// @param listener the listener to add
	//
	// @throws NullPointerException if {@code} listener is {@code null}
	//
	Parser.prototype.addParseListener = function (listener) {
		if (listener === null) {
			throw "listener";
		}
		if (this._parseListeners === null) {
			this._parseListeners = [];
		}
		this._parseListeners.push(listener);
	};

	//
	// Remove {@code listener} from the list of parse listeners.
	//
	// <p>If {@code listener} is {@code null} or has not been added as a parse
	// listener, this method does nothing.</p>
	// @param listener the listener to remove
	//
	Parser.prototype.removeParseListener = function (listener) {
		if (this._parseListeners !== null) {
			var idx = this._parseListeners.indexOf(listener);
			if (idx >= 0) {
				this._parseListeners.splice(idx, 1);
			}
			if (this._parseListeners.length === 0) {
				this._parseListeners = null;
			}
		}
	};

	// Remove all parse listeners.
	Parser.prototype.removeParseListeners = function () {
		this._parseListeners = null;
	};

	// Notify any parse listeners of an enter rule event.
	Parser.prototype.triggerEnterRuleEvent = function () {
		if (this._parseListeners !== null) {
			var ctx = this._ctx;
			this._parseListeners.map(function (listener) {
				listener.enterEveryRule(ctx);
				ctx.enterRule(listener);
			});
		}
	};

	//
	// Notify any parse listeners of an exit rule event.
	//
	// @see //addParseListener
	//
	Parser.prototype.triggerExitRuleEvent = function () {
		if (this._parseListeners !== null) {
			// reverse order walk of listeners
			var ctx = this._ctx;
			this._parseListeners.slice(0).reverse().map(function (listener) {
				ctx.exitRule(listener);
				listener.exitEveryRule(ctx);
			});
		}
	};

	Parser.prototype.getTokenFactory = function () {
		return this._input.tokenSource._factory;
	};

	// Tell our token source and error strategy about a new way to create tokens.//
	Parser.prototype.setTokenFactory = function (factory) {
		this._input.tokenSource._factory = factory;
	};

	// The ATN with bypass alternatives is expensive to create so we create it
	// lazily.
	//
	// @throws UnsupportedOperationException if the current parser does not
	// implement the {@link //getSerializedATN()} method.
	//
	Parser.prototype.getATNWithBypassAlts = function () {
		var serializedAtn = this.getSerializedATN();
		if (serializedAtn === null) {
			throw "The current parser does not support an ATN with bypass alternatives.";
		}
		var result = this.bypassAltsAtnCache[serializedAtn];
		if (result === null) {
			var deserializationOptions = new ATNDeserializationOptions();
			deserializationOptions.generateRuleBypassTransitions = true;
			result = new ATNDeserializer(deserializationOptions).deserialize(serializedAtn);
			this.bypassAltsAtnCache[serializedAtn] = result;
		}
		return result;
	};

	// The preferred method of getting a tree pattern. For example, here's a
	// sample use:
	//
	// <pre>
	// ParseTree t = parser.expr();
	// ParseTreePattern p = parser.compileParseTreePattern("&lt;ID&gt;+0",
	// MyParser.RULE_expr);
	// ParseTreeMatch m = p.match(t);
	// String id = m.get("ID");
	// </pre>

	var Lexer = __webpack_require__(22).Lexer;

	Parser.prototype.compileParseTreePattern = function (pattern, patternRuleIndex, lexer) {
		lexer = lexer || null;
		if (lexer === null) {
			if (this.getTokenStream() !== null) {
				var tokenSource = this.getTokenStream().tokenSource;
				if (tokenSource instanceof Lexer) {
					lexer = tokenSource;
				}
			}
		}
		if (lexer === null) {
			throw "Parser can't discover a lexer to use";
		}
		var m = new ParseTreePatternMatcher(lexer, this);
		return m.compile(pattern, patternRuleIndex);
	};

	Parser.prototype.getInputStream = function () {
		return this.getTokenStream();
	};

	Parser.prototype.setInputStream = function (input) {
		this.setTokenStream(input);
	};

	Parser.prototype.getTokenStream = function () {
		return this._input;
	};

	// Set the token stream and reset the parser.//
	Parser.prototype.setTokenStream = function (input) {
		this._input = null;
		this.reset();
		this._input = input;
	};

	// Match needs to return the current input symbol, which gets put
	// into the label for the associated token ref; e.g., x=ID.
	//
	Parser.prototype.getCurrentToken = function () {
		return this._input.LT(1);
	};

	Parser.prototype.notifyErrorListeners = function (msg, offendingToken, err) {
		offendingToken = offendingToken || null;
		err = err || null;
		if (offendingToken === null) {
			offendingToken = this.getCurrentToken();
		}
		this._syntaxErrors += 1;
		var line = offendingToken.line;
		var column = offendingToken.column;
		var listener = this.getErrorListenerDispatch();
		listener.syntaxError(this, offendingToken, line, column, msg, err);
	};

	//
	// Consume and return the {@linkplain //getCurrentToken current symbol}.
	//
	// <p>E.g., given the following input with {@code A} being the current
	// lookahead symbol, this function moves the cursor to {@code B} and returns
	// {@code A}.</p>
	//
	// <pre>
	// A B
	// ^
	// </pre>
	//
	// If the parser is not in error recovery mode, the consumed symbol is added
	// to the parse tree using {@link ParserRuleContext//addChild(Token)}, and
	// {@link ParseTreeListener//visitTerminal} is called on any parse listeners.
	// If the parser <em>is</em> in error recovery mode, the consumed symbol is
	// added to the parse tree using
	// {@link ParserRuleContext//addErrorNode(Token)}, and
	// {@link ParseTreeListener//visitErrorNode} is called on any parse
	// listeners.
	//
	Parser.prototype.consume = function () {
		var o = this.getCurrentToken();
		if (o.type !== Token.EOF) {
			this.getInputStream().consume();
		}
		var hasListener = this._parseListeners !== null && this._parseListeners.length > 0;
		if (this.buildParseTrees || hasListener) {
			var node;
			if (this._errHandler.inErrorRecoveryMode(this)) {
				node = this._ctx.addErrorNode(o);
			} else {
				node = this._ctx.addTokenNode(o);
			}
			node.invokingState = this.state;
			if (hasListener) {
				this._parseListeners.map(function (listener) {
					if (node instanceof ErrorNode || node.isErrorNode !== undefined && node.isErrorNode()) {
						listener.visitErrorNode(node);
					} else if (node instanceof TerminalNode) {
						listener.visitTerminal(node);
					}
				});
			}
		}
		return o;
	};

	Parser.prototype.addContextToParseTree = function () {
		// add current context to parent if we have a parent
		if (this._ctx.parentCtx !== null) {
			this._ctx.parentCtx.addChild(this._ctx);
		}
	};

	// Always called by generated parsers upon entry to a rule. Access field
	// {@link //_ctx} get the current context.

	Parser.prototype.enterRule = function (localctx, state, ruleIndex) {
		this.state = state;
		this._ctx = localctx;
		this._ctx.start = this._input.LT(1);
		if (this.buildParseTrees) {
			this.addContextToParseTree();
		}
		if (this._parseListeners !== null) {
			this.triggerEnterRuleEvent();
		}
	};

	Parser.prototype.exitRule = function () {
		this._ctx.stop = this._input.LT(-1);
		// trigger event on _ctx, before it reverts to parent
		if (this._parseListeners !== null) {
			this.triggerExitRuleEvent();
		}
		this.state = this._ctx.invokingState;
		this._ctx = this._ctx.parentCtx;
	};

	Parser.prototype.enterOuterAlt = function (localctx, altNum) {
		localctx.setAltNumber(altNum);
		// if we have new localctx, make sure we replace existing ctx
		// that is previous child of parse tree
		if (this.buildParseTrees && this._ctx !== localctx) {
			if (this._ctx.parentCtx !== null) {
				this._ctx.parentCtx.removeLastChild();
				this._ctx.parentCtx.addChild(localctx);
			}
		}
		this._ctx = localctx;
	};

	// Get the precedence level for the top-most precedence rule.
	//
	// @return The precedence level for the top-most precedence rule, or -1 if
	// the parser context is not nested within a precedence rule.

	Parser.prototype.getPrecedence = function () {
		if (this._precedenceStack.length === 0) {
			return -1;
		} else {
			return this._precedenceStack[this._precedenceStack.length - 1];
		}
	};

	Parser.prototype.enterRecursionRule = function (localctx, state, ruleIndex, precedence) {
		this.state = state;
		this._precedenceStack.push(precedence);
		this._ctx = localctx;
		this._ctx.start = this._input.LT(1);
		if (this._parseListeners !== null) {
			this.triggerEnterRuleEvent(); // simulates rule entry for
			// left-recursive rules
		}
	};

	//
	// Like {@link //enterRule} but for recursive rules.

	Parser.prototype.pushNewRecursionContext = function (localctx, state, ruleIndex) {
		var previous = this._ctx;
		previous.parentCtx = localctx;
		previous.invokingState = state;
		previous.stop = this._input.LT(-1);

		this._ctx = localctx;
		this._ctx.start = previous.start;
		if (this.buildParseTrees) {
			this._ctx.addChild(previous);
		}
		if (this._parseListeners !== null) {
			this.triggerEnterRuleEvent(); // simulates rule entry for
			// left-recursive rules
		}
	};

	Parser.prototype.unrollRecursionContexts = function (parentCtx) {
		this._precedenceStack.pop();
		this._ctx.stop = this._input.LT(-1);
		var retCtx = this._ctx; // save current ctx (return value)
		// unroll so _ctx is as it was before call to recursive method
		if (this._parseListeners !== null) {
			while (this._ctx !== parentCtx) {
				this.triggerExitRuleEvent();
				this._ctx = this._ctx.parentCtx;
			}
		} else {
			this._ctx = parentCtx;
		}
		// hook into tree
		retCtx.parentCtx = parentCtx;
		if (this.buildParseTrees && parentCtx !== null) {
			// add return ctx into invoking rule's tree
			parentCtx.addChild(retCtx);
		}
	};

	Parser.prototype.getInvokingContext = function (ruleIndex) {
		var ctx = this._ctx;
		while (ctx !== null) {
			if (ctx.ruleIndex === ruleIndex) {
				return ctx;
			}
			ctx = ctx.parentCtx;
		}
		return null;
	};

	Parser.prototype.precpred = function (localctx, precedence) {
		return precedence >= this._precedenceStack[this._precedenceStack.length - 1];
	};

	Parser.prototype.inContext = function (context) {
		// TODO: useful in parser?
		return false;
	};

	//
	// Checks whether or not {@code symbol} can follow the current state in the
	// ATN. The behavior of this method is equivalent to the following, but is
	// implemented such that the complete context-sensitive follow set does not
	// need to be explicitly constructed.
	//
	// <pre>
	// return getExpectedTokens().contains(symbol);
	// </pre>
	//
	// @param symbol the symbol type to check
	// @return {@code true} if {@code symbol} can follow the current state in
	// the ATN, otherwise {@code false}.

	Parser.prototype.isExpectedToken = function (symbol) {
		var atn = this._interp.atn;
		var ctx = this._ctx;
		var s = atn.states[this.state];
		var following = atn.nextTokens(s);
		if (following.contains(symbol)) {
			return true;
		}
		if (!following.contains(Token.EPSILON)) {
			return false;
		}
		while (ctx !== null && ctx.invokingState >= 0 && following.contains(Token.EPSILON)) {
			var invokingState = atn.states[ctx.invokingState];
			var rt = invokingState.transitions[0];
			following = atn.nextTokens(rt.followState);
			if (following.contains(symbol)) {
				return true;
			}
			ctx = ctx.parentCtx;
		}
		if (following.contains(Token.EPSILON) && symbol === Token.EOF) {
			return true;
		} else {
			return false;
		}
	};

	// Computes the set of input symbols which could follow the current parser
	// state and context, as given by {@link //getState} and {@link //getContext},
	// respectively.
	//
	// @see ATN//getExpectedTokens(int, RuleContext)
	//
	Parser.prototype.getExpectedTokens = function () {
		return this._interp.atn.getExpectedTokens(this.state, this._ctx);
	};

	Parser.prototype.getExpectedTokensWithinCurrentRule = function () {
		var atn = this._interp.atn;
		var s = atn.states[this.state];
		return atn.nextTokens(s);
	};

	// Get a rule's index (i.e., {@code RULE_ruleName} field) or -1 if not found.//
	Parser.prototype.getRuleIndex = function (ruleName) {
		var ruleIndex = this.getRuleIndexMap()[ruleName];
		if (ruleIndex !== null) {
			return ruleIndex;
		} else {
			return -1;
		}
	};

	// Return List&lt;String&gt; of the rule names in your parser instance
	// leading up to a call to the current rule. You could override if
	// you want more details such as the file/line info of where
	// in the ATN a rule is invoked.
	//
	// this is very useful for error messages.
	//
	Parser.prototype.getRuleInvocationStack = function (p) {
		p = p || null;
		if (p === null) {
			p = this._ctx;
		}
		var stack = [];
		while (p !== null) {
			// compute what follows who invoked us
			var ruleIndex = p.ruleIndex;
			if (ruleIndex < 0) {
				stack.push("n/a");
			} else {
				stack.push(this.ruleNames[ruleIndex]);
			}
			p = p.parentCtx;
		}
		return stack;
	};

	// For debugging and other purposes.//
	Parser.prototype.getDFAStrings = function () {
		return this._interp.decisionToDFA.toString();
	};
	// For debugging and other purposes.//
	Parser.prototype.dumpDFA = function () {
		var seenOne = false;
		for (var i = 0; i < this._interp.decisionToDFA.length; i++) {
			var dfa = this._interp.decisionToDFA[i];
			if (dfa.states.length > 0) {
				if (seenOne) {
					console.log();
				}
				this.printer.println("Decision " + dfa.decision + ":");
				this.printer.print(dfa.toString(this.literalNames, this.symbolicNames));
				seenOne = true;
			}
		}
	};

	/*
	"			printer = function() {\r\n" +
	"				this.println = function(s) { document.getElementById('output') += s + '\\n'; }\r\n" +
	"				this.print = function(s) { document.getElementById('output') += s; }\r\n" +
	"			};\r\n" +
	*/

	Parser.prototype.getSourceName = function () {
		return this._input.sourceName;
	};

	// During a parse is sometimes useful to listen in on the rule entry and exit
	// events as well as token matches. this is for quick and dirty debugging.
	//
	Parser.prototype.setTrace = function (trace) {
		if (!trace) {
			this.removeParseListener(this._tracer);
			this._tracer = null;
		} else {
			if (this._tracer !== null) {
				this.removeParseListener(this._tracer);
			}
			this._tracer = new TraceListener(this);
			this.addParseListener(this._tracer);
		}
	};

	exports.Parser = Parser;

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	// Generated from QLLexer.g4 by ANTLR 4.7
	// jshint ignore: start
	var antlr4 = __webpack_require__(1);

	var serializedATN = ["\x03\u608B\uA72A\u8133\uB9ED\u417C\u3BE7\u7786\u5964", "\x02W\u0271\b\x01\b\x01\x04\x02\t\x02\x04\x03\t\x03", "\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07", "\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\x0B\t\x0B\x04", "\f\t\f\x04\r\t\r\x04\x0E\t\x0E\x04\x0F\t\x0F\x04\x10", "\t\x10\x04\x11\t\x11\x04\x12\t\x12\x04\x13\t\x13", "\x04\x14\t\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17", "\t\x17\x04\x18\t\x18\x04\x19\t\x19\x04\x1A\t\x1A", "\x04\x1B\t\x1B\x04\x1C\t\x1C\x04\x1D\t\x1D\x04\x1E", "\t\x1E\x04\x1F\t\x1F\x04 \t \x04!\t!\x04\"\t\"\x04#", "\t#\x04$\t$\x04%\t%\x04&\t&\x04'\t'\x04(\t(\x04)\t)\x04", "*\t*\x04+\t+\x04,\t,\x04-\t-\x04.\t.\x04/\t/\x040\t0\x04", "1\t1\x042\t2\x043\t3\x044\t4\x045\t5\x046\t6\x047\t7\x04", "8\t8\x049\t9\x04:\t:\x04;\t;\x04<\t<\x04=\t=\x04>\t>\x04", "?\t?\x04@\t@\x04A\tA\x04B\tB\x04C\tC\x04D\tD\x04E\tE\x04", "F\tF\x04G\tG\x04H\tH\x04I\tI\x04J\tJ\x04K\tK\x04L\tL\x04", "M\tM\x04N\tN\x04O\tO\x04P\tP\x04Q\tQ\x04R\tR\x04S\tS\x04", "T\tT\x04U\tU\x04V\tV\x04W\tW\x04X\tX\x04Y\tY\x04Z\tZ\x03", "\x02\x03\x02\x03\x02\x03\x02\x03\x03\x03\x03\x03", "\x03\x03\x03\x03\x04\x03\x04\x03\x04\x03\x05\x03", "\x05\x03\x05\x03\x05\x03\x06\x03\x06\x03\x06\x03", "\x06\x03\x07\x03\x07\x03\x07\x03\x07\x03\x07\x03", "\x07\x03\x07\x03\x07\x03\b\x03\b\x03\b\x03\t\x03", "\t\x03\t\x03\t\x03\t\x03\t\x03\n\x03\n\x03\n\x03\n\x03", "\n\x03\n\x03\n\x03\n\x03\x0B\x03\x0B\x03\x0B\x03", "\x0B\x03\x0B\x03\x0B\x03\f\x03\f\x03\f\x03\f\x03", "\f\x03\r\x03\r\x03\r\x03\r\x03\r\x03\x0E\x03\x0E\x03", "\x0E\x03\x0E\x03\x0E\x03\x0F\x03\x0F\x03\x0F\x03", "\x0F\x03\x0F\x03\x0F\x03\x0F\x03\x10\x03\x10\x03", "\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03\x10\x03", "\x11\x03\x11\x03\x11\x03\x11\x03\x11\x03\x11\x03", "\x12\x03\x12\x03\x12\x03\x12\x03\x12\x03\x12\x03", "\x13\x03\x13\x03\x13\x03\x13\x03\x13\x03\x13\x03", "\x13\x03\x14\x03\x14\x03\x14\x03\x14\x03\x14\x03", "\x14\x03\x15\x03\x15\x03\x15\x03\x15\x03\x15\x03", "\x16\x03\x16\x03\x16\x03\x17\x03\x17\x03\x17\x03", "\x17\x03\x17\x03\x17\x03\x17\x03\x17\x03\x18\x03", "\x18\x03\x18\x03\x18\x03\x18\x03\x18\x03\x18\x03", "\x19\x03\x19\x03\x19\x03\x1A\x03\x1A\x03\x1A\x03", "\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03\x1A\x03", "\x1A\x03\x1A\x03\x1B\x03\x1B\x03\x1B\x03\x1B\x03", "\x1C\x03\x1C\x03\x1C\x03\x1C\x03\x1D\x03\x1D\x03", "\x1D\x03\x1D\x03\x1E\x03\x1E\x03\x1E\x03\x1E\x03", "\x1E\x03\x1E\x03\x1E\x03\x1F\x03\x1F\x03\x1F\x03", "\x1F\x03 \x03 \x03 \x03 \x03 \x03!\x03!\x03!\x03", "\"\x03\"\x03\"\x03\"\x03\"\x03\"\x03#\x03#\x03#\x03", "#\x03#\x03#\x03#\x03#\x03#\x03#\x03$\x03$\x03$\x03", "$\x03$\x03%\x03%\x03%\x03%\x03%\x03%\x03%\x03&\x03", "&\x03&\x03&\x03&\x03&\x03&\x03'\x03'\x03'\x03'", "\x03'\x03'\x03'\x03'\x03'\x03'\x03'\x03'\x03", "(\x03(\x03(\x03(\x03(\x03(\x03(\x03(\x03(\x03(\x03", ")\x03)\x03)\x03)\x03)\x03)\x03)\x03)\x03)\x03)\x03", ")\x03)\x03)\x03*\x03*\x03*\x03*\x03*\x03*\x03*\x03", "+\x03+\x03+\x03+\x03+\x03+\x03+\x03,\x03,\x03,\x03", ",\x03-\x03-\x03-\x03-\x03-\x03-\x03.\x03.\x03.\x03", ".\x03.\x03/\x03/\x03/\x03/\x03/\x030\x030\x030\x03", "0\x030\x031\x031\x031\x031\x031\x031\x032\x032\x03", "3\x033\x033\x034\x034\x035\x035\x036\x036\x036\x03", "7\x037\x038\x038\x039\x039\x03:\x03:\x03;\x03;\x03", ";\x03<\x03<\x03=\x03=\x03>\x03>\x03>\x03?\x03?\x03", "@\x03@\x03A\x03A\x03B\x03B\x03C\x03C\x03D\x03D\x03", "E\x03E\x03F\x03F\x03G\x03G\x03H\x03H\x03I\x03I\x03", "I\x03J\x03J\x03K\x03K\x03L\x03L\x03M\x03M\x03N\x03", "N\x07N\u0216\nN\fN\x0EN\u0219\x0BN\x03O\x03O\x07O\u021D", "\nO\fO\x0EO\u0220\x0BO\x03P\x03P\x03P\x03Q\x03Q\x03", "Q\x03R\x06R\u0229\nR\rR\x0ER\u022A\x03S\x03S\x03S\x03", "S\x03T\x03T\x03T\x03T\x07T\u0235\nT\fT\x0ET\u0238\x0B", "T\x03T\x03T\x03U\x06U\u023D\nU\rU\x0EU\u023E\x03U\x03", "U\x03V\x03V\x03V\x03V\x03V\x07V\u0248\nV\fV\x0EV\u024B", "\x0BV\x05V\u024D\nV\x03V\x03V\x03V\x03V\x03V\x03W\x03", "W\x03W\x03W\x07W\u0258\nW\fW\x0EW\u025B\x0BW\x03W\x03", "W\x03X\x03X\x03X\x03X\x03X\x03X\x03Y\x03Y\x03Y\x03", "Y\x03Y\x03Z\x06Z\u026B\nZ\rZ\x0EZ\u026C\x03Z\x05Z\u0270", "\nZ\x03\u0249\x02[\x04\x03\x06\x04\b\x05\n\x06\f\x07", "\x0E\b\x10\t\x12\n\x14\x0B\x16\f\x18\r\x1A\x0E\x1C", "\x0F\x1E\x10 \x11\"\x12$\x13&\x14(\x15*\x16,\x17", ".\x180\x192\x1A4\x1B6\x1C8\x1D:\x1E<\x1F> @!B\"D#F$", "H%J&L'N(P)R*T+V,X-Z.\\/^0`1b2d3f4h5j6l7n8p9r:t;v<x=z>|?~@\x80A\x82", "B\x84C\x86D\x88E\x8AF\x8CG\x8EH\x90I\x92J\x94\x02", "\x96\x02\x98\x02\x9A\x02\x9CK\x9EL\xA0M\xA2N\xA4", "O\xA6P\xA8Q\xAAR\xACS\xAET\xB0U\xB2V\xB4W\x04\x02", "\x03\x0B\x03\x022;\x03\x02c|\x03\x02C\\\x06\x02", "2;C\\aac|\x06\x02\x0B\f\x0F\x0F$$^^\x07\x02$$^^ppttvv", "\x05\x02\x0B\f\x0E\x0F\"\"\x03\x02,,\x04\x02\f\f\x0F", "\x0F\x02\u0276\x02\x04\x03\x02\x02\x02\x02\x06\x03", "\x02\x02\x02\x02\b\x03\x02\x02\x02\x02\n\x03\x02", "\x02\x02\x02\f\x03\x02\x02\x02\x02\x0E\x03\x02", "\x02\x02\x02\x10\x03\x02\x02\x02\x02\x12\x03\x02", "\x02\x02\x02\x14\x03\x02\x02\x02\x02\x16\x03\x02", "\x02\x02\x02\x18\x03\x02\x02\x02\x02\x1A\x03\x02", "\x02\x02\x02\x1C\x03\x02\x02\x02\x02\x1E\x03\x02", "\x02\x02\x02 \x03\x02\x02\x02\x02\"\x03\x02\x02", "\x02\x02$\x03\x02\x02\x02\x02&\x03\x02\x02\x02", "\x02(\x03\x02\x02\x02\x02*\x03\x02\x02\x02\x02", ",\x03\x02\x02\x02\x02.\x03\x02\x02\x02\x020\x03", "\x02\x02\x02\x022\x03\x02\x02\x02\x024\x03\x02", "\x02\x02\x026\x03\x02\x02\x02\x028\x03\x02\x02", "\x02\x02:\x03\x02\x02\x02\x02<\x03\x02\x02\x02", "\x02>\x03\x02\x02\x02\x02@\x03\x02\x02\x02\x02", "B\x03\x02\x02\x02\x02D\x03\x02\x02\x02\x02F\x03", "\x02\x02\x02\x02H\x03\x02\x02\x02\x02J\x03\x02", "\x02\x02\x02L\x03\x02\x02\x02\x02N\x03\x02\x02", "\x02\x02P\x03\x02\x02\x02\x02R\x03\x02\x02\x02", "\x02T\x03\x02\x02\x02\x02V\x03\x02\x02\x02\x02", "X\x03\x02\x02\x02\x02Z\x03\x02\x02\x02\x02\\\x03", "\x02\x02\x02\x02^\x03\x02\x02\x02\x02`\x03\x02", "\x02\x02\x02b\x03\x02\x02\x02\x02d\x03\x02\x02", "\x02\x02f\x03\x02\x02\x02\x02h\x03\x02\x02\x02", "\x02j\x03\x02\x02\x02\x02l\x03\x02\x02\x02\x02", "n\x03\x02\x02\x02\x02p\x03\x02\x02\x02\x02r\x03", "\x02\x02\x02\x02t\x03\x02\x02\x02\x02v\x03\x02", "\x02\x02\x02x\x03\x02\x02\x02\x02z\x03\x02\x02", "\x02\x02|\x03\x02\x02\x02\x02~\x03\x02\x02\x02", "\x02\x80\x03\x02\x02\x02\x02\x82\x03\x02\x02\x02", "\x02\x84\x03\x02\x02\x02\x02\x86\x03\x02\x02\x02", "\x02\x88\x03\x02\x02\x02\x02\x8A\x03\x02\x02\x02", "\x02\x8C\x03\x02\x02\x02\x02\x8E\x03\x02\x02\x02", "\x02\x90\x03\x02\x02\x02\x02\x92\x03\x02\x02\x02", "\x02\x9C\x03\x02\x02\x02\x02\x9E\x03\x02\x02\x02", "\x02\xA0\x03\x02\x02\x02\x02\xA2\x03\x02\x02\x02", "\x02\xA4\x03\x02\x02\x02\x02\xA6\x03\x02\x02\x02", "\x02\xA8\x03\x02\x02\x02\x02\xAA\x03\x02\x02\x02", "\x02\xAC\x03\x02\x02\x02\x02\xAE\x03\x02\x02\x02", "\x02\xB0\x03\x02\x02\x02\x03\xB2\x03\x02\x02\x02", "\x03\xB4\x03\x02\x02\x02\x04\xB6\x03\x02\x02\x02", "\x06\xBA\x03\x02\x02\x02\b\xBE\x03\x02\x02\x02", "\n\xC1\x03\x02\x02\x02\f\xC5\x03\x02\x02\x02\x0E", "\xC9\x03\x02\x02\x02\x10\xD1\x03\x02\x02\x02\x12", "\xD4\x03\x02\x02\x02\x14\xDA\x03\x02\x02\x02\x16", "\xE2\x03\x02\x02\x02\x18\xE8\x03\x02\x02\x02\x1A", "\xED\x03\x02\x02\x02\x1C\xF2\x03\x02\x02\x02\x1E", "\xF7\x03\x02\x02\x02 \xFE\x03\x02\x02\x02\"\u0106", "\x03\x02\x02\x02$\u010C\x03\x02\x02\x02&\u0112\x03", "\x02\x02\x02(\u0119\x03\x02\x02\x02*\u011F\x03\x02", "\x02\x02,\u0124\x03\x02\x02\x02.\u0127\x03\x02\x02", "\x020\u012F\x03\x02\x02\x022\u0136\x03\x02\x02\x02", "4\u0139\x03\x02\x02\x026\u0144\x03\x02\x02\x028\u0148", "\x03\x02\x02\x02:\u014C\x03\x02\x02\x02<\u0150\x03", "\x02\x02\x02>\u0157\x03\x02\x02\x02@\u015B\x03\x02", "\x02\x02B\u0160\x03\x02\x02\x02D\u0163\x03\x02\x02", "\x02F\u0169\x03\x02\x02\x02H\u0173\x03\x02\x02\x02", "J\u0178\x03\x02\x02\x02L\u017F\x03\x02\x02\x02N\u0186", "\x03\x02\x02\x02P\u0192\x03\x02\x02\x02R\u019C\x03", "\x02\x02\x02T\u01A9\x03\x02\x02\x02V\u01B0\x03\x02", "\x02\x02X\u01B7\x03\x02\x02\x02Z\u01BB\x03\x02\x02", "\x02\\\u01C1\x03\x02\x02\x02^\u01C6\x03\x02\x02\x02", "`\u01CB\x03\x02\x02\x02b\u01D0\x03\x02\x02\x02d\u01D6", "\x03\x02\x02\x02f\u01D8\x03\x02\x02\x02h\u01DB\x03", "\x02\x02\x02j\u01DD\x03\x02\x02\x02l\u01DF\x03\x02", "\x02\x02n\u01E2\x03\x02\x02\x02p\u01E4\x03\x02\x02", "\x02r\u01E6\x03\x02\x02\x02t\u01E8\x03\x02\x02\x02", "v\u01EA\x03\x02\x02\x02x\u01ED\x03\x02\x02\x02z\u01EF", "\x03\x02\x02\x02|\u01F1\x03\x02\x02\x02~\u01F4\x03", "\x02\x02\x02\x80\u01F6\x03\x02\x02\x02\x82\u01F8\x03", "\x02\x02\x02\x84\u01FA\x03\x02\x02\x02\x86\u01FC\x03", "\x02\x02\x02\x88\u01FE\x03\x02\x02\x02\x8A\u0200\x03", "\x02\x02\x02\x8C\u0202\x03\x02\x02\x02\x8E\u0204\x03", "\x02\x02\x02\x90\u0206\x03\x02\x02\x02\x92\u0208\x03", "\x02\x02\x02\x94\u020B\x03\x02\x02\x02\x96\u020D\x03", "\x02\x02\x02\x98\u020F\x03\x02\x02\x02\x9A\u0211\x03", "\x02\x02\x02\x9C\u0213\x03\x02\x02\x02\x9E\u021A\x03", "\x02\x02\x02\xA0\u0221\x03\x02\x02\x02\xA2\u0224\x03", "\x02\x02\x02\xA4\u0228\x03\x02\x02\x02\xA6\u022C\x03", "\x02\x02\x02\xA8\u0230\x03\x02\x02\x02\xAA\u023C\x03", "\x02\x02\x02\xAC\u0242\x03\x02\x02\x02\xAE\u0253\x03", "\x02\x02\x02\xB0\u025E\x03\x02\x02\x02\xB2\u0264\x03", "\x02\x02\x02\xB4\u026F\x03\x02\x02\x02\xB6\xB7\x07", "c\x02\x02\xB7\xB8\x07p\x02\x02\xB8\xB9\x07f\x02", "\x02\xB9\x05\x03\x02\x02\x02\xBA\xBB\x07c\x02", "\x02\xBB\xBC\x07p\x02\x02\xBC\xBD\x07{\x02\x02", "\xBD\x07\x03\x02\x02\x02\xBE\xBF\x07c\x02\x02", "\xBF\xC0\x07u\x02\x02\xC0\t\x03\x02\x02\x02\xC1", "\xC2\x07c\x02\x02\xC2\xC3\x07u\x02\x02\xC3\xC4", "\x07e\x02\x02\xC4\x0B\x03\x02\x02\x02\xC5\xC6", "\x07c\x02\x02\xC6\xC7\x07x\x02\x02\xC7\xC8\x07", "i\x02\x02\xC8\r\x03\x02\x02\x02\xC9\xCA\x07d\x02", "\x02\xCA\xCB\x07q\x02\x02\xCB\xCC\x07q\x02\x02", "\xCC\xCD\x07n\x02\x02\xCD\xCE\x07g\x02\x02\xCE", "\xCF\x07c\x02\x02\xCF\xD0\x07p\x02\x02\xD0\x0F", "\x03\x02\x02\x02\xD1\xD2\x07d\x02\x02\xD2\xD3", "\x07{\x02\x02\xD3\x11\x03\x02\x02\x02\xD4\xD5", "\x07e\x02\x02\xD5\xD6\x07n\x02\x02\xD6\xD7\x07", "c\x02\x02\xD7\xD8\x07u\x02\x02\xD8\xD9\x07u\x02", "\x02\xD9\x13\x03\x02\x02\x02\xDA\xDB\x07p\x02", "\x02\xDB\xDC\x07g\x02\x02\xDC\xDD\x07y\x02\x02", "\xDD\xDE\x07v\x02\x02\xDE\xDF\x07{\x02\x02\xDF", "\xE0\x07r\x02\x02\xE0\xE1\x07g\x02\x02\xE1\x15", "\x03\x02\x02\x02\xE2\xE3\x07e\x02\x02\xE3\xE4", "\x07q\x02\x02\xE4\xE5\x07w\x02\x02\xE5\xE6\x07", "p\x02\x02\xE6\xE7\x07v\x02\x02\xE7\x17\x03\x02", "\x02\x02\xE8\xE9\x07f\x02\x02\xE9\xEA\x07c\x02", "\x02\xEA\xEB\x07v\x02\x02\xEB\xEC\x07g\x02\x02", "\xEC\x19\x03\x02\x02\x02\xED\xEE\x07f\x02\x02", "\xEE\xEF\x07g\x02\x02\xEF\xF0\x07u\x02\x02\xF0", "\xF1\x07e\x02\x02\xF1\x1B\x03\x02\x02\x02\xF2", "\xF3\x07g\x02\x02\xF3\xF4\x07n\x02\x02\xF4\xF5", "\x07u\x02\x02\xF5\xF6\x07g\x02\x02\xF6\x1D\x03", "\x02\x02\x02\xF7\xF8\x07g\x02\x02\xF8\xF9\x07", "z\x02\x02\xF9\xFA\x07k\x02\x02\xFA\xFB\x07u\x02", "\x02\xFB\xFC\x07v\x02\x02\xFC\xFD\x07u\x02\x02", "\xFD\x1F\x03\x02\x02\x02\xFE\xFF\x07g\x02\x02", "\xFF\u0100\x07z\x02\x02\u0100\u0101\x07v\x02\x02\u0101", "\u0102\x07g\x02\x02\u0102\u0103\x07p\x02\x02\u0103\u0104", "\x07f\x02\x02\u0104\u0105\x07u\x02\x02\u0105!\x03\x02", "\x02\x02\u0106\u0107\x07h\x02\x02\u0107\u0108\x07c\x02", "\x02\u0108\u0109\x07n\x02\x02\u0109\u010A\x07u\x02\x02", "\u010A\u010B\x07g\x02\x02\u010B#\x03\x02\x02\x02\u010C", "\u010D\x07h\x02\x02\u010D\u010E\x07n\x02\x02\u010E\u010F", "\x07q\x02\x02\u010F\u0110\x07c\x02\x02\u0110\u0111\x07", "v\x02\x02\u0111%\x03\x02\x02\x02\u0112\u0113\x07h\x02", "\x02\u0113\u0114\x07q\x02\x02\u0114\u0115\x07t\x02\x02", "\u0115\u0116\x07c\x02\x02\u0116\u0117\x07n\x02\x02\u0117", "\u0118\x07n\x02\x02\u0118'\x03\x02\x02\x02\u0119\u011A", "\x07h\x02\x02\u011A\u011B\x07q\x02\x02\u011B\u011C\x07", "t\x02\x02\u011C\u011D\x07g\x02\x02\u011D\u011E\x07z\x02", "\x02\u011E)\x03\x02\x02\x02\u011F\u0120\x07h\x02\x02", "\u0120\u0121\x07t\x02\x02\u0121\u0122\x07q\x02\x02\u0122", "\u0123\x07o\x02\x02\u0123+\x03\x02\x02\x02\u0124\u0125", "\x07k\x02\x02\u0125\u0126\x07h\x02\x02\u0126-\x03\x02", "\x02\x02\u0127\u0128\x07k\x02\x02\u0128\u0129\x07o\x02", "\x02\u0129\u012A\x07r\x02\x02\u012A\u012B\x07n\x02\x02", "\u012B\u012C\x07k\x02\x02\u012C\u012D\x07g\x02\x02\u012D", "\u012E\x07u\x02\x02\u012E/\x03\x02\x02\x02\u012F\u0130", "\x07k\x02\x02\u0130\u0131\x07o\x02\x02\u0131\u0132\x07", "r\x02\x02\u0132\u0133\x07q\x02\x02\u0133\u0134\x07t\x02", "\x02\u0134\u0135\x07v\x02\x02\u01351\x03\x02\x02\x02", "\u0136\u0137\x07k\x02\x02\u0137\u0138\x07p\x02\x02\u0138", "3\x03\x02\x02\x02\u0139\u013A\x07k\x02\x02\u013A\u013B", "\x07p\x02\x02\u013B\u013C\x07u\x02\x02\u013C\u013D\x07", "v\x02\x02\u013D\u013E\x07c\x02\x02\u013E\u013F\x07p\x02", "\x02\u013F\u0140\x07e\x02\x02\u0140\u0141\x07g\x02\x02", "\u0141\u0142\x07q\x02\x02\u0142\u0143\x07h\x02\x02\u0143", "5\x03\x02\x02\x02\u0144\u0145\x07k\x02\x02\u0145\u0146", "\x07p\x02\x02\u0146\u0147\x07v\x02\x02\u01477\x03\x02", "\x02\x02\u0148\u0149\x07o\x02\x02\u0149\u014A\x07c\x02", "\x02\u014A\u014B\x07z\x02\x02\u014B9\x03\x02\x02\x02", "\u014C\u014D\x07o\x02\x02\u014D\u014E\x07k\x02\x02\u014E", "\u014F\x07p\x02\x02\u014F;\x03\x02\x02\x02\u0150\u0151", "\x07o\x02\x02\u0151\u0152\x07q\x02\x02\u0152\u0153\x07", "f\x02\x02\u0153\u0154\x07w\x02\x02\u0154\u0155\x07n\x02", "\x02\u0155\u0156\x07g\x02\x02\u0156=\x03\x02\x02\x02", "\u0157\u0158\x07p\x02\x02\u0158\u0159\x07q\x02\x02\u0159", "\u015A\x07v\x02\x02\u015A?\x03\x02\x02\x02\u015B\u015C", "\x07p\x02\x02\u015C\u015D\x07q\x02\x02\u015D\u015E\x07", "p\x02\x02\u015E\u015F\x07g\x02\x02\u015FA\x03\x02\x02", "\x02\u0160\u0161\x07q\x02\x02\u0161\u0162\x07t\x02\x02", "\u0162C\x03\x02\x02\x02\u0163\u0164\x07q\x02\x02\u0164", "\u0165\x07t\x02\x02\u0165\u0166\x07f\x02\x02\u0166\u0167", "\x07g\x02\x02\u0167\u0168\x07t\x02\x02\u0168E\x03\x02", "\x02\x02\u0169\u016A\x07r\x02\x02\u016A\u016B\x07t\x02", "\x02\u016B\u016C\x07g\x02\x02\u016C\u016D\x07f\x02\x02", "\u016D\u016E\x07k\x02\x02\u016E\u016F\x07e\x02\x02\u016F", "\u0170\x07c\x02\x02\u0170\u0171\x07v\x02\x02\u0171\u0172", "\x07g\x02\x02\u0172G\x03\x02\x02\x02\u0173\u0174\x07", "t\x02\x02\u0174\u0175\x07c\x02\x02\u0175\u0176\x07p\x02", "\x02\u0176\u0177\x07m\x02\x02\u0177I\x03\x02\x02\x02", "\u0178\u0179\x07t\x02\x02\u0179\u017A\x07g\x02\x02\u017A", "\u017B\x07u\x02\x02\u017B\u017C\x07w\x02\x02\u017C\u017D", "\x07n\x02\x02\u017D\u017E\x07v\x02\x02\u017EK\x03\x02", "\x02\x02\u017F\u0180\x07u\x02\x02\u0180\u0181\x07g\x02", "\x02\u0181\u0182\x07n\x02\x02\u0182\u0183\x07g\x02\x02", "\u0183\u0184\x07e\x02\x02\u0184\u0185\x07v\x02\x02\u0185", "M\x03\x02\x02\x02\u0186\u0187\x07u\x02\x02\u0187\u0188", "\x07v\x02\x02\u0188\u0189\x07t\x02\x02\u0189\u018A\x07", "k\x02\x02\u018A\u018B\x07e\x02\x02\u018B\u018C\x07v\x02", "\x02\u018C\u018D\x07e\x02\x02\u018D\u018E\x07q\x02\x02", "\u018E\u018F\x07w\x02\x02\u018F\u0190\x07p\x02\x02\u0190", "\u0191\x07v\x02\x02\u0191O\x03\x02\x02\x02\u0192\u0193", "\x07u\x02\x02\u0193\u0194\x07v\x02\x02\u0194\u0195\x07", "t\x02\x02\u0195\u0196\x07k\x02\x02\u0196\u0197\x07e\x02", "\x02\u0197\u0198\x07v\x02\x02\u0198\u0199\x07u\x02\x02", "\u0199\u019A\x07w\x02\x02\u019A\u019B\x07o\x02\x02\u019B", "Q\x03\x02\x02\x02\u019C\u019D\x07u\x02\x02\u019D\u019E", "\x07v\x02\x02\u019E\u019F\x07t\x02\x02\u019F\u01A0\x07", "k\x02\x02\u01A0\u01A1\x07e\x02\x02\u01A1\u01A2\x07v\x02", "\x02\u01A2\u01A3\x07e\x02\x02\u01A3\u01A4\x07q\x02\x02", "\u01A4\u01A5\x07p\x02\x02\u01A5\u01A6\x07e\x02\x02\u01A6", "\u01A7\x07c\x02\x02\u01A7\u01A8\x07v\x02\x02\u01A8S\x03", "\x02\x02\x02\u01A9\u01AA\x07e\x02\x02\u01AA\u01AB\x07", "q\x02\x02\u01AB\u01AC\x07p\x02\x02\u01AC\u01AD\x07e\x02", "\x02\u01AD\u01AE\x07c\x02\x02\u01AE\u01AF\x07v\x02\x02", "\u01AFU\x03\x02\x02\x02\u01B0\u01B1\x07u\x02\x02\u01B1", "\u01B2\x07v\x02\x02\u01B2\u01B3\x07t\x02\x02\u01B3\u01B4", "\x07k\x02\x02\u01B4\u01B5\x07p\x02\x02\u01B5\u01B6\x07", "i\x02\x02\u01B6W\x03\x02\x02\x02\u01B7\u01B8\x07u\x02", "\x02\u01B8\u01B9\x07w\x02\x02\u01B9\u01BA\x07o\x02\x02", "\u01BAY\x03\x02\x02\x02\u01BB\u01BC\x07u\x02\x02\u01BC", "\u01BD\x07w\x02\x02\u01BD\u01BE\x07r\x02\x02\u01BE\u01BF", "\x07g\x02\x02\u01BF\u01C0\x07t\x02\x02\u01C0[\x03\x02", "\x02\x02\u01C1\u01C2\x07v\x02\x02\u01C2\u01C3\x07j\x02", "\x02\u01C3\u01C4\x07g\x02\x02\u01C4\u01C5\x07p\x02\x02", "\u01C5]\x03\x02\x02\x02\u01C6\u01C7\x07v\x02\x02\u01C7", "\u01C8\x07j\x02\x02\u01C8\u01C9\x07k\x02\x02\u01C9\u01CA", "\x07u\x02\x02\u01CA_\x03\x02\x02\x02\u01CB\u01CC\x07", "v\x02\x02\u01CC\u01CD\x07t\x02\x02\u01CD\u01CE\x07w\x02", "\x02\u01CE\u01CF\x07g\x02\x02\u01CFa\x03\x02\x02\x02", "\u01D0\u01D1\x07y\x02\x02\u01D1\u01D2\x07j\x02\x02\u01D2", "\u01D3\x07g\x02\x02\u01D3\u01D4\x07t\x02\x02\u01D4\u01D5", "\x07g\x02\x02\u01D5c\x03\x02\x02\x02\u01D6\u01D7\x07", ">\x02\x02\u01D7e\x03\x02\x02\x02\u01D8\u01D9\x07>\x02", "\x02\u01D9\u01DA\x07?\x02\x02\u01DAg\x03\x02\x02\x02", "\u01DB\u01DC\x07?\x02\x02\u01DCi\x03\x02\x02\x02\u01DD", "\u01DE\x07@\x02\x02\u01DEk\x03\x02\x02\x02\u01DF\u01E0", "\x07@\x02\x02\u01E0\u01E1\x07?\x02\x02\u01E1m\x03\x02", "\x02\x02\u01E2\u01E3\x07a\x02\x02\u01E3o\x03\x02\x02", "\x02\u01E4\u01E5\x07/\x02\x02\u01E5q\x03\x02\x02\x02", "\u01E6\u01E7\x07.\x02\x02\u01E7s\x03\x02\x02\x02\u01E8", "\u01E9\x07=\x02\x02\u01E9u\x03\x02\x02\x02\u01EA\u01EB", "\x07#\x02\x02\u01EB\u01EC\x07?\x02\x02\u01ECw\x03\x02", "\x02\x02\u01ED\u01EE\x071\x02\x02\u01EEy\x03\x02\x02", "\x02\u01EF\u01F0\x070\x02\x02\u01F0{\x03\x02\x02\x02", "\u01F1\u01F2\x070\x02\x02\u01F2\u01F3\x070\x02\x02\u01F3", "}\x03\x02\x02\x02\u01F4\u01F5\x07*\x02\x02\u01F5\x7F", "\x03\x02\x02\x02\u01F6\u01F7\x07+\x02\x02\u01F7\x81", "\x03\x02\x02\x02\u01F8\u01F9\x07]\x02\x02\u01F9\x83", "\x03\x02\x02\x02\u01FA\u01FB\x07_\x02\x02\u01FB\x85", "\x03\x02\x02\x02\u01FC\u01FD\x07}\x02\x02\u01FD\x87", "\x03\x02\x02\x02\u01FE\u01FF\x07\x7F\x02\x02\u01FF\x89", "\x03\x02\x02\x02\u0200\u0201\x07,\x02\x02\u0201\x8B", "\x03\x02\x02\x02\u0202\u0203\x07'\x02\x02\u0203\x8D", "\x03\x02\x02\x02\u0204\u0205\x07-\x02\x02\u0205\x8F", "\x03\x02\x02\x02\u0206\u0207\x07~\x02\x02\u0207\x91", "\x03\x02\x02\x02\u0208\u0209\x07<\x02\x02\u0209\u020A", "\x07<\x02\x02\u020A\x93\x03\x02\x02\x02\u020B\u020C", "\t\x02\x02\x02\u020C\x95\x03\x02\x02\x02\u020D\u020E", "\t\x03\x02\x02\u020E\x97\x03\x02\x02\x02\u020F\u0210", "\t\x04\x02\x02\u0210\x99\x03\x02\x02\x02\u0211\u0212", "\t\x05\x02\x02\u0212\x9B\x03\x02\x02\x02\u0213\u0217", "\x05\x96K\x02\u0214\u0216\x05\x9AM\x02\u0215\u0214\x03", "\x02\x02\x02\u0216\u0219\x03\x02\x02\x02\u0217\u0215\x03", "\x02\x02\x02\u0217\u0218\x03\x02\x02\x02\u0218\x9D\x03", "\x02\x02\x02\u0219\u0217\x03\x02\x02\x02\u021A\u021E\x05", "\x98L\x02\u021B\u021D\x05\x9AM\x02\u021C\u021B\x03\x02", "\x02\x02\u021D\u0220\x03\x02\x02\x02\u021E\u021C\x03\x02", "\x02\x02\u021E\u021F\x03\x02\x02\x02\u021F\x9F\x03\x02", "\x02\x02\u0220\u021E\x03\x02\x02\x02\u0221\u0222\x07B", "\x02\x02\u0222\u0223\x05\x9CN\x02\u0223\xA1\x03\x02", "\x02\x02\u0224\u0225\x07B\x02\x02\u0225\u0226\x05\x9E", "O\x02\u0226\xA3\x03\x02\x02\x02\u0227\u0229\x05\x94", "J\x02\u0228\u0227\x03\x02\x02\x02\u0229\u022A\x03\x02", "\x02\x02\u022A\u0228\x03\x02\x02\x02\u022A\u022B\x03\x02", "\x02\x02\u022B\xA5\x03\x02\x02\x02\u022C\u022D\x05\xA4", "R\x02\u022D\u022E\x070\x02\x02\u022E\u022F\x05\xA4R\x02", "\u022F\xA7\x03\x02\x02\x02\u0230\u0236\x07$\x02\x02", "\u0231\u0235\n\x06\x02\x02\u0232\u0233\x07^\x02\x02\u0233", "\u0235\t\x07\x02\x02\u0234\u0231\x03\x02\x02\x02\u0234", "\u0232\x03\x02\x02\x02\u0235\u0238\x03\x02\x02\x02\u0236", "\u0234\x03\x02\x02\x02\u0236\u0237\x03\x02\x02\x02\u0237", "\u0239\x03\x02\x02\x02\u0238\u0236\x03\x02\x02\x02\u0239", "\u023A\x07$\x02\x02\u023A\xA9\x03\x02\x02\x02\u023B", "\u023D\t\b\x02\x02\u023C\u023B\x03\x02\x02\x02\u023D\u023E", "\x03\x02\x02\x02\u023E\u023C\x03\x02\x02\x02\u023E\u023F", "\x03\x02\x02\x02\u023F\u0240\x03\x02\x02\x02\u0240\u0241", "\bU\x02\x02\u0241\xAB\x03\x02\x02\x02\u0242\u0243\x07", "1\x02\x02\u0243\u0244\x07,\x02\x02\u0244\u024C\x03\x02", "\x02\x02\u0245\u0249\n\t\x02\x02\u0246\u0248\x0B\x02\x02", "\x02\u0247\u0246\x03\x02\x02\x02\u0248\u024B\x03\x02\x02", "\x02\u0249\u024A\x03\x02\x02\x02\u0249\u0247\x03\x02\x02", "\x02\u024A\u024D\x03\x02\x02\x02\u024B\u0249\x03\x02\x02", "\x02\u024C\u0245\x03\x02\x02\x02\u024C\u024D\x03\x02\x02", "\x02\u024D\u024E\x03\x02\x02\x02\u024E\u024F\x07,\x02", "\x02\u024F\u0250\x071\x02\x02\u0250\u0251\x03\x02\x02", "\x02\u0251\u0252\bV\x03\x02\u0252\xAD\x03\x02\x02\x02", "\u0253\u0254\x071\x02\x02\u0254\u0255\x071\x02\x02\u0255", "\u0259\x03\x02\x02\x02\u0256\u0258\n\n\x02\x02\u0257\u0256", "\x03\x02\x02\x02\u0258\u025B\x03\x02\x02\x02\u0259\u0257", "\x03\x02\x02\x02\u0259\u025A\x03\x02\x02\x02\u025A\u025C", "\x03\x02\x02\x02\u025B\u0259\x03\x02\x02\x02\u025C\u025D", "\bW\x03\x02\u025D\xAF\x03\x02\x02\x02\u025E\u025F\x07", "1\x02\x02\u025F\u0260\x07,\x02\x02\u0260\u0261\x07,\x02", "\x02\u0261\u0262\x03\x02\x02\x02\u0262\u0263\bX\x04\x02", "\u0263\xB1\x03\x02\x02\x02\u0264\u0265\x07,\x02\x02", "\u0265\u0266\x071\x02\x02\u0266\u0267\x03\x02\x02\x02", "\u0267\u0268\bY\x05\x02\u0268\xB3\x03\x02\x02\x02\u0269", "\u026B\n\t\x02\x02\u026A\u0269\x03\x02\x02\x02\u026B\u026C", "\x03\x02\x02\x02\u026C\u026A\x03\x02\x02\x02\u026C\u026D", "\x03\x02\x02\x02\u026D\u0270\x03\x02\x02\x02\u026E\u0270", "\x07,\x02\x02\u026F\u026A\x03\x02\x02\x02\u026F\u026E", "\x03\x02\x02\x02\u0270\xB5\x03\x02\x02\x02\x0F\x02", "\x03\u0217\u021E\u022A\u0234\u0236\u023E\u0249\u024C\u0259\u026C\u026F", "\x06\x02\x03\x02\x02\x04\x02\x07\x03\x02\x06\x02", "\x02"].join("");

	var atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

	var decisionsToDFA = atn.decisionToState.map(function (ds, index) {
	    return new antlr4.dfa.DFA(ds, index);
	});

	function QLLexer(input) {
	    antlr4.Lexer.call(this, input);
	    this._interp = new antlr4.atn.LexerATNSimulator(this, atn, decisionsToDFA, new antlr4.PredictionContextCache());
	    return this;
	}

	QLLexer.prototype = Object.create(antlr4.Lexer.prototype);
	QLLexer.prototype.constructor = QLLexer;

	QLLexer.EOF = antlr4.Token.EOF;
	QLLexer.AND = 1;
	QLLexer.ANY = 2;
	QLLexer.AS = 3;
	QLLexer.ASC = 4;
	QLLexer.AVG = 5;
	QLLexer.BOOLEAN = 6;
	QLLexer.BY = 7;
	QLLexer.CLASS = 8;
	QLLexer.NEWTYPE = 9;
	QLLexer.COUNT = 10;
	QLLexer.DATE = 11;
	QLLexer.DESC = 12;
	QLLexer.ELSE = 13;
	QLLexer.EXISTS = 14;
	QLLexer.EXTENDS = 15;
	QLLexer.FALSE = 16;
	QLLexer.FLOAT = 17;
	QLLexer.FORALL = 18;
	QLLexer.FOREX = 19;
	QLLexer.FROM = 20;
	QLLexer.IF = 21;
	QLLexer.IMPLIES = 22;
	QLLexer.IMPORT = 23;
	QLLexer.IN = 24;
	QLLexer.INSTANCEOF = 25;
	QLLexer.INT = 26;
	QLLexer.MAX = 27;
	QLLexer.MIN = 28;
	QLLexer.MODULE = 29;
	QLLexer.NOT = 30;
	QLLexer.NONE = 31;
	QLLexer.OR = 32;
	QLLexer.ORDER = 33;
	QLLexer.PREDICATE = 34;
	QLLexer.RANK = 35;
	QLLexer.RESULT = 36;
	QLLexer.SELECT = 37;
	QLLexer.STRICTCOUNT = 38;
	QLLexer.STRICTSUM = 39;
	QLLexer.STRICTCONCAT = 40;
	QLLexer.CONCAT = 41;
	QLLexer.STRING = 42;
	QLLexer.SUM = 43;
	QLLexer.SUPER = 44;
	QLLexer.THEN = 45;
	QLLexer.THIS = 46;
	QLLexer.TRUE = 47;
	QLLexer.WHERE = 48;
	QLLexer.LT = 49;
	QLLexer.LE = 50;
	QLLexer.EQ = 51;
	QLLexer.GT = 52;
	QLLexer.GE = 53;
	QLLexer.UNDERSCORE = 54;
	QLLexer.MINUS = 55;
	QLLexer.COMMA = 56;
	QLLexer.SEMI = 57;
	QLLexer.NE = 58;
	QLLexer.SLASH = 59;
	QLLexer.DOT = 60;
	QLLexer.RANGE = 61;
	QLLexer.OPAR = 62;
	QLLexer.CPAR = 63;
	QLLexer.OBLOCK = 64;
	QLLexer.CBLOCK = 65;
	QLLexer.OBRACE = 66;
	QLLexer.CBRACE = 67;
	QLLexer.STAR = 68;
	QLLexer.MOD = 69;
	QLLexer.PLUS = 70;
	QLLexer.BAR = 71;
	QLLexer.SELECTION = 72;
	QLLexer.Lowerid = 73;
	QLLexer.Upperid = 74;
	QLLexer.Atlowerid = 75;
	QLLexer.Atupperid = 76;
	QLLexer.Integer = 77;
	QLLexer.Float = 78;
	QLLexer.String = 79;
	QLLexer.WS = 80;
	QLLexer.COMMENT = 81;
	QLLexer.LINE_COMMENT = 82;
	QLLexer.StartQLDoc = 83;
	QLLexer.EndQLDoc = 84;
	QLLexer.CONTENT = 85;

	QLLexer.QLDOC = 1;

	QLLexer.prototype.channelNames = ["DEFAULT_TOKEN_CHANNEL", "HIDDEN"];

	QLLexer.prototype.modeNames = ["DEFAULT_MODE", "QLDOC"];

	QLLexer.prototype.literalNames = [null, "'and'", "'any'", "'as'", "'asc'", "'avg'", "'boolean'", "'by'", "'class'", "'newtype'", "'count'", "'date'", "'desc'", "'else'", "'exists'", "'extends'", "'false'", "'float'", "'forall'", "'forex'", "'from'", "'if'", "'implies'", "'import'", "'in'", "'instanceof'", "'int'", "'max'", "'min'", "'module'", "'not'", "'none'", "'or'", "'order'", "'predicate'", "'rank'", "'result'", "'select'", "'strictcount'", "'strictsum'", "'strictconcat'", "'concat'", "'string'", "'sum'", "'super'", "'then'", "'this'", "'true'", "'where'", "'<'", "'<='", "'='", "'>'", "'>='", "'_'", "'-'", "','", "';'", "'!='", "'/'", "'.'", "'..'", "'('", "')'", "'['", "']'", "'{'", "'}'", "'*'", "'%'", "'+'", "'|'", "'::'", null, null, null, null, null, null, null, null, null, null, "'/**'", "'*/'"];

	QLLexer.prototype.symbolicNames = [null, "AND", "ANY", "AS", "ASC", "AVG", "BOOLEAN", "BY", "CLASS", "NEWTYPE", "COUNT", "DATE", "DESC", "ELSE", "EXISTS", "EXTENDS", "FALSE", "FLOAT", "FORALL", "FOREX", "FROM", "IF", "IMPLIES", "IMPORT", "IN", "INSTANCEOF", "INT", "MAX", "MIN", "MODULE", "NOT", "NONE", "OR", "ORDER", "PREDICATE", "RANK", "RESULT", "SELECT", "STRICTCOUNT", "STRICTSUM", "STRICTCONCAT", "CONCAT", "STRING", "SUM", "SUPER", "THEN", "THIS", "TRUE", "WHERE", "LT", "LE", "EQ", "GT", "GE", "UNDERSCORE", "MINUS", "COMMA", "SEMI", "NE", "SLASH", "DOT", "RANGE", "OPAR", "CPAR", "OBLOCK", "CBLOCK", "OBRACE", "CBRACE", "STAR", "MOD", "PLUS", "BAR", "SELECTION", "Lowerid", "Upperid", "Atlowerid", "Atupperid", "Integer", "Float", "String", "WS", "COMMENT", "LINE_COMMENT", "StartQLDoc", "EndQLDoc", "CONTENT"];

	QLLexer.prototype.ruleNames = ["AND", "ANY", "AS", "ASC", "AVG", "BOOLEAN", "BY", "CLASS", "NEWTYPE", "COUNT", "DATE", "DESC", "ELSE", "EXISTS", "EXTENDS", "FALSE", "FLOAT", "FORALL", "FOREX", "FROM", "IF", "IMPLIES", "IMPORT", "IN", "INSTANCEOF", "INT", "MAX", "MIN", "MODULE", "NOT", "NONE", "OR", "ORDER", "PREDICATE", "RANK", "RESULT", "SELECT", "STRICTCOUNT", "STRICTSUM", "STRICTCONCAT", "CONCAT", "STRING", "SUM", "SUPER", "THEN", "THIS", "TRUE", "WHERE", "LT", "LE", "EQ", "GT", "GE", "UNDERSCORE", "MINUS", "COMMA", "SEMI", "NE", "SLASH", "DOT", "RANGE", "OPAR", "CPAR", "OBLOCK", "CBLOCK", "OBRACE", "CBRACE", "STAR", "MOD", "PLUS", "BAR", "SELECTION", "Digit", "Lower", "Upper", "IdentLetter", "Lowerid", "Upperid", "Atlowerid", "Atupperid", "Integer", "Float", "String", "WS", "COMMENT", "LINE_COMMENT", "StartQLDoc", "EndQLDoc", "CONTENT"];

	QLLexer.prototype.grammarFileName = "QLLexer.g4";

	exports.QLLexer = QLLexer;

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Generated from QLParser.g4 by ANTLR 4.7
	// jshint ignore: start
	var antlr4 = __webpack_require__(1);
	var QLParserVisitor = __webpack_require__(51).QLParserVisitor;

	var grammarFileName = "QLParser.g4";

	var serializedATN = ['\x03\u608B\uA72A\u8133\uB9ED\u417C\u3BE7\u7786\u5964', '\x03W\u02A3\x04\x02\t\x02\x04\x03\t\x03\x04\x04\t', '\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07\t\x07\x04', '\b\t\b\x04\t\t\t\x04\n\t\n\x04\x0B\t\x0B\x04\f\t\f\x04', '\r\t\r\x04\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04', '\x11\t\x11\x04\x12\t\x12\x04\x13\t\x13\x04\x14\t', '\x14\x04\x15\t\x15\x04\x16\t\x16\x04\x17\t\x17\x04', '\x18\t\x18\x04\x19\t\x19\x04\x1A\t\x1A\x04\x1B\t', '\x1B\x04\x1C\t\x1C\x04\x1D\t\x1D\x04\x1E\t\x1E\x04', '\x1F\t\x1F\x04 \t \x04!\t!\x04"\t"\x04#\t#\x04$\t$\x04', '%\t%\x04&\t&\x04\'\t\'\x04(\t(\x04)\t)\x04*\t*\x04+\t+\x04', ',\t,\x04-\t-\x04.\t.\x04/\t/\x040\t0\x041\t1\x042\t2\x04', '3\t3\x044\t4\x045\t5\x046\t6\x047\t7\x048\t8\x049\t9\x04', ':\t:\x04;\t;\x04<\t<\x04=\t=\x04>\t>\x04?\t?\x04@\t@\x04', 'A\tA\x04B\tB\x04C\tC\x04D\tD\x04E\tE\x03\x02\x03\x02', '\x03\x02\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03', '\x03\x03\x03\x03\x05\x03\x95\n\x03\x03\x04\x07', '\x04\x98\n\x04\f\x04\x0E\x04\x9B\x0B\x04\x03\x05', '\x07\x05\x9E\n\x05\f\x05\x0E\x05\xA1\x0B\x05\x03', '\x05\x03\x05\x03\x05\x03\x05\x03\x05\x03\x05\x05', '\x05\xA9\n\x05\x03\x05\x05\x05\xAC\n\x05\x03\x06', '\x03\x06\x03\x06\x03\x06\x05\x06\xB2\n\x06\x03', '\x07\x03\x07\x03\x07\x03\x07\x03\b\x03\b\x03\b\x03', '\b\x03\t\x03\t\x03\t\x03\t\x03\n\x03\n\x03\n\x03\n\x03', '\n\x03\n\x03\n\x03\n\x05\n\xC8\n\n\x03\x0B\x03\x0B', '\x03\x0B\x03\x0B\x03\x0B\x03\f\x03\f\x03\f\x07\f', '\xD2\n\f\f\f\x0E\f\xD5\x0B\f\x03\r\x05\r\xD8\n\r\x03', '\r\x07\r\xDB\n\r\f\r\x0E\r\xDE\x0B\r\x03\r\x03\r\x03', '\r\x03\r\x03\r\x03\r\x03\x0E\x03\x0E\x05\x0E\xE8', '\n\x0E\x03\x0F\x03\x0F\x05\x0F\xEC\n\x0F\x03\x0F', '\x03\x0F\x05\x0F\xF0\n\x0F\x03\x0F\x03\x0F\x03', '\x0F\x05\x0F\xF5\n\x0F\x03\x10\x03\x10\x03\x10', '\x03\x10\x03\x10\x03\x10\x07\x10\xFD\n\x10\f\x10', '\x0E\x10\u0100\x0B\x10\x03\x10\x03\x10\x07\x10\u0104', '\n\x10\f\x10\x0E\x10\u0107\x0B\x10\x03\x10\x03\x10', '\x03\x10\x05\x10\u010C\n\x10\x03\x11\x07\x11\u010F', '\n\x11\f\x11\x0E\x11\u0112\x0B\x11\x03\x11\x03\x11', '\x03\x11\x05\x11\u0117\n\x11\x03\x11\x05\x11\u011A', '\n\x11\x03\x12\x03\x12\x03\x12\x03\x12\x03\x12', '\x03\x12\x03\x12\x03\x13\x03\x13\x03\x13\x03\x13', '\x03\x13\x03\x13\x03\x13\x03\x14\x03\x14\x03\x14', '\x03\x15\x03\x15\x03\x15\x05\x15\u0130\n\x15\x03', '\x16\x03\x16\x03\x17\x03\x17\x03\x17\x03\x17\x03', '\x18\x03\x18\x03\x18\x03\x18\x03\x18\x03\x18\x07', '\x18\u013E\n\x18\f\x18\x0E\x18\u0141\x0B\x18\x05\x18', '\u0143\n\x18\x03\x18\x03\x18\x03\x18\x03\x18\x03', '\x18\x03\x19\x03\x19\x03\x19\x03\x19\x03\x19\x03', '\x19\x03\x19\x03\x19\x03\x19\x03\x19\x03\x19\x03', '\x19\x03\x19\x03\x19\x03\x19\x03\x19\x03\x19\x03', '\x19\x03\x19\x03\x19\x03\x19\x03\x19\x03\x19\x03', '\x19\x03\x19\x03\x19\x03\x19\x03\x19\x05\x19\u0166', '\n\x19\x03\x19\x03\x19\x03\x19\x03\x19\x03\x19', '\x03\x19\x03\x19\x03\x19\x03\x19\x03\x19\x03\x19', '\x03\x19\x03\x19\x03\x19\x03\x19\x03\x19\x03\x19', '\x03\x19\x03\x19\x03\x19\x03\x19\x03\x19\x03\x19', '\x03\x19\x03\x19\x03\x19\x03\x19\x07\x19\u0183\n', '\x19\f\x19\x0E\x19\u0186\x0B\x19\x03\x1A\x03\x1A', '\x03\x1B\x03\x1B\x03\x1B\x03\x1B\x03\x1B\x05\x1B', '\u018F\n\x1B\x05\x1B\u0191\n\x1B\x03\x1B\x05\x1B\u0194', '\n\x1B\x03\x1C\x03\x1C\x03\x1D\x03\x1D\x05\x1D', '\u019A\n\x1D\x03\x1E\x03\x1E\x03\x1E\x07\x1E\u019F', '\n\x1E\f\x1E\x0E\x1E\u01A2\x0B\x1E\x05\x1E\u01A4\n\x1E', '\x03\x1F\x03\x1F\x05\x1F\u01A8\n\x1F\x03\x1F\x03', '\x1F\x03\x1F\x03\x1F\x03\x1F\x03\x1F\x03\x1F\x03', '\x1F\x05\x1F\u01B2\n\x1F\x03 \x03 \x03 \x05 \u01B7\n', ' \x03 \x03 \x03 \x03 \x03 \x03 \x03 \x03 \x03 \x05', ' \u01C2\n \x03 \x03 \x03 \x03 \x03 \x03 \x07 \u01CA\n', ' \f \x0E \u01CD\x0B \x03 \x03 \x05 \u01D1\n \x03 \x03', ' \x03 \x03 \x03 \x03 \x03 \x03 \x03 \x03 \x03 \x03', ' \x03 \x03 \x05 \u01E1\n \x03 \x03 \x03 \x07 \u01E6\n', ' \f \x0E \u01E9\x0B \x03!\x03!\x03!\x05!\u01EE\n!\x03', '!\x03!\x03!\x05!\u01F3\n!\x05!\u01F5\n!\x05!\u01F7\n!\x03', '!\x03!\x05!\u01FB\n!\x05!\u01FD\n!\x03"\x03"\x03"\x03', '"\x05"\u0203\n"\x03#\x03#\x03$\x03$\x03$\x05$\u020A', '\n$\x03%\x03%\x03&\x03&\x03\'\x03\'\x03(\x03(\x03', ')\x03)\x03*\x03*\x03+\x03+\x03+\x07+\u021B\n+\f+\x0E', '+\u021E\x0B+\x05+\u0220\n+\x03,\x03,\x03,\x03-\x03-\x03', '-\x07-\u0228\n-\f-\x0E-\u022B\x0B-\x03.\x03.\x03.\x05', '.\u0230\n.\x03/\x03/\x03/\x03/\x03/\x07/\u0237\n/\f/\x0E', '/\u023A\x0B/\x030\x030\x050\u023E\n0\x031\x031\x071\u0242', '\n1\f1\x0E1\u0245\x0B1\x031\x031\x032\x032\x033\x03', '3\x034\x034\x035\x035\x035\x035\x035\x035\x075\u0255', '\n5\f5\x0E5\u0258\x0B5\x035\x035\x055\u025C\n5\x036\x03', '6\x037\x037\x037\x057\u0263\n7\x038\x038\x039\x039\x03', '9\x079\u026A\n9\f9\x0E9\u026D\x0B9\x03:\x03:\x03:\x07', ':\u0272\n:\f:\x0E:\u0275\x0B:\x03;\x03;\x03;\x07;\u027A', '\n;\f;\x0E;\u027D\x0B;\x03<\x03<\x03=\x03=\x03>\x03', '>\x03?\x03?\x05?\u0287\n?\x03@\x03@\x03@\x05@\u028C\n', '@\x03@\x03@\x05@\u0290\n@\x03A\x03A\x03B\x03B\x03B\x05', 'B\u0297\nB\x03B\x03B\x03C\x03C\x03C\x03C\x03D\x03D\x03', 'E\x03E\x03E\x02\x040>F\x02\x04\x06\b\n\f\x0E\x10\x12', '\x14\x16\x18\x1A\x1C\x1E "$&(*,.02468:<>@BDFHJLNPRTVXZ', '\\^`bdfhjlnprtvxz|~\x80\x82\x84\x86\x88\x02\x0E\x04', '\x02\x04\x04!!\x04\x02\x10\x10\x14\x15\x04\x02', '\x12\x1211\x04\x0237<<\x04\x0299HH\x04\x02==FG\x04', '\x02FFHH\x04\x02\x06\x06\x0E\x0E\x03\x02KL\x03\x02', 'KM\b\x02\b\b\r\r\x13\x13\x1C\x1C,,MM\t\x02\x04\x04\x07', '\x07\f\f\x1D\x1E%%(+--\x02\u02B9\x02\x8A\x03\x02\x02', '\x02\x04\x8D\x03\x02\x02\x02\x06\x99\x03\x02\x02', '\x02\b\xAB\x03\x02\x02\x02\n\xAD\x03\x02\x02\x02', '\f\xB3\x03\x02\x02\x02\x0E\xB7\x03\x02\x02\x02', '\x10\xBB\x03\x02\x02\x02\x12\xBF\x03\x02\x02\x02', '\x14\xC9\x03\x02\x02\x02\x16\xCE\x03\x02\x02\x02', '\x18\xD7\x03\x02\x02\x02\x1A\xE7\x03\x02\x02\x02', '\x1C\xEB\x03\x02\x02\x02\x1E\xF6\x03\x02\x02\x02', ' \u0119\x03\x02\x02\x02"\u011B\x03\x02\x02\x02$\u0122', '\x03\x02\x02\x02&\u0129\x03\x02\x02\x02(\u012F\x03', '\x02\x02\x02*\u0131\x03\x02\x02\x02,\u0133\x03\x02', '\x02\x02.\u0137\x03\x02\x02\x020\u0165\x03\x02\x02', '\x022\u0187\x03\x02\x02\x024\u0193\x03\x02\x02\x02', '6\u0195\x03\x02\x02\x028\u0199\x03\x02\x02\x02:\u01A3', '\x03\x02\x02\x02<\u01B1\x03\x02\x02\x02>\u01E0\x03', '\x02\x02\x02@\u01FC\x03\x02\x02\x02B\u0202\x03\x02', '\x02\x02D\u0204\x03\x02\x02\x02F\u0209\x03\x02\x02', '\x02H\u020B\x03\x02\x02\x02J\u020D\x03\x02\x02\x02', 'L\u020F\x03\x02\x02\x02N\u0211\x03\x02\x02\x02P\u0213', '\x03\x02\x02\x02R\u0215\x03\x02\x02\x02T\u021F\x03', '\x02\x02\x02V\u0221\x03\x02\x02\x02X\u0224\x03\x02', '\x02\x02Z\u022C\x03\x02\x02\x02\\\u0231\x03\x02\x02', '\x02^\u023B\x03\x02\x02\x02`\u023F\x03\x02\x02\x02', 'b\u0248\x03\x02\x02\x02d\u024A\x03\x02\x02\x02f\u024C', '\x03\x02\x02\x02h\u025B\x03\x02\x02\x02j\u025D\x03', '\x02\x02\x02l\u0262\x03\x02\x02\x02n\u0264\x03\x02', '\x02\x02p\u0266\x03\x02\x02\x02r\u026E\x03\x02\x02', '\x02t\u0276\x03\x02\x02\x02v\u027E\x03\x02\x02\x02', 'x\u0280\x03\x02\x02\x02z\u0282\x03\x02\x02\x02|\u0286', '\x03\x02\x02\x02~\u028F\x03\x02\x02\x02\x80\u0291', '\x03\x02\x02\x02\x82\u0296\x03\x02\x02\x02\x84\u029A', '\x03\x02\x02\x02\x86\u029E\x03\x02\x02\x02\x88\u02A0', '\x03\x02\x02\x02\x8A\x8B\x05\x06\x04\x02\x8B\x8C', '\x07\x02\x02\x03\x8C\x03\x03\x02\x02\x02\x8D\x8E', '\x07\x1F\x02\x02\x8E\x94\x05n8\x02\x8F\x90\x07', 'D\x02\x02\x90\x91\x05\x06\x04\x02\x91\x92\x07', 'E\x02\x02\x92\x95\x03\x02\x02\x02\x93\x95\x05', '\f\x07\x02\x94\x8F\x03\x02\x02\x02\x94\x93\x03', '\x02\x02\x02\x95\x05\x03\x02\x02\x02\x96\x98\x05', '\b\x05\x02\x97\x96\x03\x02\x02\x02\x98\x9B\x03', '\x02\x02\x02\x99\x97\x03\x02\x02\x02\x99\x9A\x03', '\x02\x02\x02\x9A\x07\x03\x02\x02\x02\x9B\x99\x03', '\x02\x02\x02\x9C\x9E\x05h5\x02\x9D\x9C\x03\x02', '\x02\x02\x9E\xA1\x03\x02\x02\x02\x9F\x9D\x03\x02', '\x02\x02\x9F\xA0\x03\x02\x02\x02\xA0\xA8\x03\x02', '\x02\x02\xA1\x9F\x03\x02\x02\x02\xA2\xA9\x05\n', '\x06\x02\xA3\xA9\x05\x12\n\x02\xA4\xA9\x05\x1E', '\x10\x02\xA5\xA9\x05\x14\x0B\x02\xA6\xA9\x05\x1C', '\x0F\x02\xA7\xA9\x05\x04\x03\x02\xA8\xA2\x03\x02', '\x02\x02\xA8\xA3\x03\x02\x02\x02\xA8\xA4\x03\x02', '\x02\x02\xA8\xA5\x03\x02\x02\x02\xA8\xA6\x03\x02', '\x02\x02\xA8\xA7\x03\x02\x02\x02\xA9\xAC\x03\x02', '\x02\x02\xAA\xAC\x05`1\x02\xAB\x9F\x03\x02\x02', '\x02\xAB\xAA\x03\x02\x02\x02\xAC\t\x03\x02\x02', '\x02\xAD\xAE\x07\x19\x02\x02\xAE\xB1\x05r:\x02', '\xAF\xB0\x07\x05\x02\x02\xB0\xB2\x05n8\x02\xB1', '\xAF\x03\x02\x02\x02\xB1\xB2\x03\x02\x02\x02\xB2', '\x0B\x03\x02\x02\x02\xB3\xB4\x075\x02\x02\xB4', '\xB5\x05t;\x02\xB5\xB6\x07;\x02\x02\xB6\r\x03\x02', '\x02\x02\xB7\xB8\x075\x02\x02\xB8\xB9\x05\x84', 'C\x02\xB9\xBA\x07;\x02\x02\xBA\x0F\x03\x02\x02', '\x02\xBB\xBC\x075\x02\x02\xBC\xBD\x05~@\x02\xBD', '\xBE\x07;\x02\x02\xBE\x11\x03\x02\x02\x02\xBF', '\xC0\x05|?\x02\xC0\xC7\x05\x80A\x02\xC1\xC2\x07', '@\x02\x02\xC2\xC3\x05T+\x02\xC3\xC4\x07A\x02\x02', '\xC4\xC5\x05(\x15\x02\xC5\xC8\x03\x02\x02\x02', '\xC6\xC8\x05\x0E\b\x02\xC7\xC1\x03\x02\x02\x02', '\xC7\xC6\x03\x02\x02\x02\xC8\x13\x03\x02\x02\x02', '\xC9\xCA\x07\x0B\x02\x02\xCA\xCB\x05x=\x02\xCB', '\xCC\x075\x02\x02\xCC\xCD\x05\x16\f\x02\xCD\x15', '\x03\x02\x02\x02\xCE\xD3\x05\x18\r\x02\xCF\xD0', '\x07"\x02\x02\xD0\xD2\x05\x18\r\x02\xD1\xCF\x03', '\x02\x02\x02\xD2\xD5\x03\x02\x02\x02\xD3\xD1\x03', '\x02\x02\x02\xD3\xD4\x03\x02\x02\x02\xD4\x17\x03', '\x02\x02\x02\xD5\xD3\x03\x02\x02\x02\xD6\xD8\x05', '`1\x02\xD7\xD6\x03\x02\x02\x02\xD7\xD8\x03\x02', '\x02\x02\xD8\xDC\x03\x02\x02\x02\xD9\xDB\x05h', '5\x02\xDA\xD9\x03\x02\x02\x02\xDB\xDE\x03\x02', '\x02\x02\xDC\xDA\x03\x02\x02\x02\xDC\xDD\x03\x02', '\x02\x02\xDD\xDF\x03\x02\x02\x02\xDE\xDC\x03\x02', '\x02\x02\xDF\xE0\x05x=\x02\xE0\xE1\x07@\x02\x02', '\xE1\xE2\x05T+\x02\xE2\xE3\x07A\x02\x02\xE3\xE4', '\x05\x1A\x0E\x02\xE4\x19\x03\x02\x02\x02\xE5\xE8', '\x03\x02\x02\x02\xE6\xE8\x05,\x17\x02\xE7\xE5', '\x03\x02\x02\x02\xE7\xE6\x03\x02\x02\x02\xE8\x1B', '\x03\x02\x02\x02\xE9\xEA\x07\x16\x02\x02\xEA\xEC', '\x05T+\x02\xEB\xE9\x03\x02\x02\x02\xEB\xEC\x03', '\x02\x02\x02\xEC\xEF\x03\x02\x02\x02\xED\xEE\x07', '2\x02\x02\xEE\xF0\x050\x19\x02\xEF\xED\x03\x02', '\x02\x02\xEF\xF0\x03\x02\x02\x02\xF0\xF1\x03\x02', '\x02\x02\xF1\xF2\x07\'\x02\x02\xF2\xF4\x05X-\x02', '\xF3\xF5\x05\\/\x02\xF4\xF3\x03\x02\x02\x02\xF4', '\xF5\x03\x02\x02\x02\xF5\x1D\x03\x02\x02\x02\xF6', '\xF7\x07\n\x02\x02\xF7\u010B\x05x=\x02\xF8\xF9\x07', '\x11\x02\x02\xF9\xFE\x05~@\x02\xFA\xFB\x07:\x02', '\x02\xFB\xFD\x05~@\x02\xFC\xFA\x03\x02\x02\x02', '\xFD\u0100\x03\x02\x02\x02\xFE\xFC\x03\x02\x02\x02', '\xFE\xFF\x03\x02\x02\x02\xFF\u0101\x03\x02\x02\x02', '\u0100\xFE\x03\x02\x02\x02\u0101\u0105\x07D\x02\x02', '\u0102\u0104\x05 \x11\x02\u0103\u0102\x03\x02\x02\x02', '\u0104\u0107\x03\x02\x02\x02\u0105\u0103\x03\x02\x02\x02', '\u0105\u0106\x03\x02\x02\x02\u0106\u0108\x03\x02\x02\x02', '\u0107\u0105\x03\x02\x02\x02\u0108\u0109\x07E\x02\x02', '\u0109\u010C\x03\x02\x02\x02\u010A\u010C\x05\x10\t\x02', '\u010B\xF8\x03\x02\x02\x02\u010B\u010A\x03\x02\x02\x02', '\u010C\x1F\x03\x02\x02\x02\u010D\u010F\x05h5\x02\u010E', '\u010D\x03\x02\x02\x02\u010F\u0112\x03\x02\x02\x02\u0110', '\u010E\x03\x02\x02\x02\u0110\u0111\x03\x02\x02\x02\u0111', '\u0116\x03\x02\x02\x02\u0112\u0110\x03\x02\x02\x02\u0113', '\u0117\x05"\x12\x02\u0114\u0117\x05$\x13\x02\u0115\u0117', '\x05&\x14\x02\u0116\u0113\x03\x02\x02\x02\u0116\u0114', '\x03\x02\x02\x02\u0116\u0115\x03\x02\x02\x02\u0117\u011A', '\x03\x02\x02\x02\u0118\u011A\x05`1\x02\u0119\u0110\x03', '\x02\x02\x02\u0119\u0118\x03\x02\x02\x02\u011A!\x03', '\x02\x02\x02\u011B\u011C\x05x=\x02\u011C\u011D\x07@\x02', '\x02\u011D\u011E\x07A\x02\x02\u011E\u011F\x07D\x02\x02', '\u011F\u0120\x050\x19\x02\u0120\u0121\x07E\x02\x02\u0121', '#\x03\x02\x02\x02\u0122\u0123\x05|?\x02\u0123\u0124\x05', '\x80A\x02\u0124\u0125\x07@\x02\x02\u0125\u0126\x05T+\x02', '\u0126\u0127\x07A\x02\x02\u0127\u0128\x05(\x15\x02\u0128', '%\x03\x02\x02\x02\u0129\u012A\x05V,\x02\u012A\u012B\x07', ';\x02\x02\u012B\'\x03\x02\x02\x02\u012C\u0130\x05*\x16', '\x02\u012D\u0130\x05,\x17\x02\u012E\u0130\x05.\x18\x02', '\u012F\u012C\x03\x02\x02\x02\u012F\u012D\x03\x02\x02\x02', '\u012F\u012E\x03\x02\x02\x02\u0130)\x03\x02\x02\x02', '\u0131\u0132\x07;\x02\x02\u0132+\x03\x02\x02\x02\u0133', '\u0134\x07D\x02\x02\u0134\u0135\x050\x19\x02\u0135\u0136', '\x07E\x02\x02\u0136-\x03\x02\x02\x02\u0137\u0138\x07', '5\x02\x02\u0138\u0139\x05f4\x02\u0139\u0142\x07@\x02\x02', '\u013A\u013F\x05\x84C\x02\u013B\u013C\x07:\x02\x02\u013C', '\u013E\x05\x84C\x02\u013D\u013B\x03\x02\x02\x02\u013E', '\u0141\x03\x02\x02\x02\u013F\u013D\x03\x02\x02\x02\u013F', '\u0140\x03\x02\x02\x02\u0140\u0143\x03\x02\x02\x02\u0141', '\u013F\x03\x02\x02\x02\u0142\u013A\x03\x02\x02\x02\u0142', '\u0143\x03\x02\x02\x02\u0143\u0144\x03\x02\x02\x02\u0144', '\u0145\x07A\x02\x02\u0145\u0146\x07@\x02\x02\u0146\u0147', '\x05:\x1E\x02\u0147\u0148\x07A\x02\x02\u0148/\x03\x02', '\x02\x02\u0149\u014A\b\x19\x01\x02\u014A\u014B\x052\x1A', '\x02\u014B\u014C\x07@\x02\x02\u014C\u014D\x07A\x02\x02', '\u014D\u0166\x03\x02\x02\x02\u014E\u014F\x07@\x02\x02', '\u014F\u0150\x05~@\x02\u0150\u0151\x07A\x02\x02\u0151\u0152', '\x050\x19\x10\u0152\u0166\x03\x02\x02\x02\u0153\u0166', '\x05> \x02\u0154\u0155\x05J&\x02\u0155\u0156\x050\x19\x0E', '\u0156\u0166\x03\x02\x02\x02\u0157\u0158\x07 \x02\x02', '\u0158\u0166\x050\x19\b\u0159\u015A\x07\x17\x02\x02\u015A', '\u015B\x050\x19\x02\u015B\u015C\x07/\x02\x02\u015C\u015D', '\x050\x19\x02\u015D\u015E\x07\x0F\x02\x02\u015E\u015F', '\x050\x19\x07\u015F\u0166\x03\x02\x02\x02\u0160\u0161', '\x056\x1C\x02\u0161\u0162\x07@\x02\x02\u0162\u0163\x05', '4\x1B\x02\u0163\u0164\x07A\x02\x02\u0164\u0166\x03\x02', '\x02\x02\u0165\u0149\x03\x02\x02\x02\u0165\u014E\x03\x02', '\x02\x02\u0165\u0153\x03\x02\x02\x02\u0165\u0154\x03\x02', '\x02\x02\u0165\u0157\x03\x02\x02\x02\u0165\u0159\x03\x02', '\x02\x02\u0165\u0160\x03\x02\x02\x02\u0166\u0184\x03\x02', '\x02\x02\u0167\u0168\f\r\x02\x02\u0168\u0169\x05L\'\x02', '\u0169\u016A\x050\x19\x0E\u016A\u0183\x03\x02\x02\x02', '\u016B\u016C\f\f\x02\x02\u016C\u016D\x05N(\x02\u016D\u016E\x05', '0\x19\r\u016E\u0183\x03\x02\x02\x02\u016F\u0170\f\n\x02', '\x02\u0170\u0171\x05H%\x02\u0171\u0172\x050\x19\x0B\u0172', '\u0183\x03\x02\x02\x02\u0173\u0174\f\x06\x02\x02\u0174', '\u0175\x07\x03\x02\x02\u0175\u0183\x050\x19\x07\u0176', '\u0177\f\x05\x02\x02\u0177\u0178\x07"\x02\x02\u0178\u0183', '\x050\x19\x06\u0179\u017A\f\x04\x02\x02\u017A\u017B\x07', '\x18\x02\x02\u017B\u0183\x050\x19\x04\u017C\u017D\f\x0B', '\x02\x02\u017D\u017E\x07\x1A\x02\x02\u017E\u0183\x05>', ' \x02\u017F\u0180\f\t\x02\x02\u0180\u0181\x07\x1B\x02\x02', '\u0181\u0183\x05~@\x02\u0182\u0167\x03\x02\x02\x02\u0182', '\u016B\x03\x02\x02\x02\u0182\u016F\x03\x02\x02\x02\u0182', '\u0173\x03\x02\x02\x02\u0182\u0176\x03\x02\x02\x02\u0182', '\u0179\x03\x02\x02\x02\u0182\u017C\x03\x02\x02\x02\u0182', '\u017F\x03\x02\x02\x02\u0183\u0186\x03\x02\x02\x02\u0184', '\u0182\x03\x02\x02\x02\u0184\u0185\x03\x02\x02\x02\u0185', '1\x03\x02\x02\x02\u0186\u0184\x03\x02\x02\x02\u0187', '\u0188\t\x02\x02\x02\u01883\x03\x02\x02\x02\u0189\u0190', '\x05T+\x02\u018A\u018B\x07I\x02\x02\u018B\u018E\x050\x19', '\x02\u018C\u018D\x07I\x02\x02\u018D\u018F\x050\x19\x02', '\u018E\u018C\x03\x02\x02\x02\u018E\u018F\x03\x02\x02\x02', '\u018F\u0191\x03\x02\x02\x02\u0190\u018A\x03\x02\x02\x02', '\u0190\u0191\x03\x02\x02\x02\u0191\u0194\x03\x02\x02\x02', '\u0192\u0194\x050\x19\x02\u0193\u0189\x03\x02\x02\x02', '\u0193\u0192\x03\x02\x02\x02\u01945\x03\x02\x02\x02', '\u0195\u0196\t\x03\x02\x02\u01967\x03\x02\x02\x02\u0197', '\u019A\x050\x19\x02\u0198\u019A\x078\x02\x02\u0199\u0197', '\x03\x02\x02\x02\u0199\u0198\x03\x02\x02\x02\u019A9', '\x03\x02\x02\x02\u019B\u01A0\x058\x1D\x02\u019C\u019D', '\x07:\x02\x02\u019D\u019F\x058\x1D\x02\u019E\u019C\x03', '\x02\x02\x02\u019F\u01A2\x03\x02\x02\x02\u01A0\u019E\x03', '\x02\x02\x02\u01A0\u01A1\x03\x02\x02\x02\u01A1\u01A4\x03', '\x02\x02\x02\u01A2\u01A0\x03\x02\x02\x02\u01A3\u019B\x03', '\x02\x02\x02\u01A3\u01A4\x03\x02\x02\x02\u01A4;\x03', '\x02\x02\x02\u01A5\u01A7\x05\x80A\x02\u01A6\u01A8\x05', 'P)\x02\u01A7\u01A6\x03\x02\x02\x02\u01A7\u01A8\x03\x02', '\x02\x02\u01A8\u01A9\x03\x02\x02\x02\u01A9\u01AA\x07@', '\x02\x02\u01AA\u01AB\x05:\x1E\x02\u01AB\u01AC\x07A\x02', '\x02\u01AC\u01B2\x03\x02\x02\x02\u01AD\u01AE\x07@\x02', '\x02\u01AE\u01AF\x05~@\x02\u01AF\u01B0\x07A\x02\x02\u01B0', '\u01B2\x03\x02\x02\x02\u01B1\u01A5\x03\x02\x02\x02\u01B1', '\u01AD\x03\x02\x02\x02\u01B2=\x03\x02\x02\x02\u01B3', '\u01B4\b \x01\x02\u01B4\u01B6\x05\x82B\x02\u01B5\u01B7\x05', 'P)\x02\u01B6\u01B5\x03\x02\x02\x02\u01B6\u01B7\x03\x02', '\x02\x02\u01B7\u01B8\x03\x02\x02\x02\u01B8\u01B9\x07@', '\x02\x02\u01B9\u01BA\x05:\x1E\x02\u01BA\u01BB\x07A\x02', '\x02\u01BB\u01E1\x03\x02\x02\x02\u01BC\u01E1\x05B"\x02', '\u01BD\u01E1\x05F$\x02\u01BE\u01BF\x05~@\x02\u01BF\u01C0\x07', '>\x02\x02\u01C0\u01C2\x03\x02\x02\x02\u01C1\u01BE\x03', '\x02\x02\x02\u01C1\u01C2\x03\x02\x02\x02\u01C2\u01C3\x03', '\x02\x02\x02\u01C3\u01E1\x07.\x02\x02\u01C4\u01D0\x05', '\x88E\x02\u01C5\u01C6\x07B\x02\x02\u01C6\u01CB\x050\x19', '\x02\u01C7\u01C8\x07:\x02\x02\u01C8\u01CA\x050\x19\x02', '\u01C9\u01C7\x03\x02\x02\x02\u01CA\u01CD\x03\x02\x02\x02', '\u01CB\u01C9\x03\x02\x02\x02\u01CB\u01CC\x03\x02\x02\x02', '\u01CC\u01CE\x03\x02\x02\x02\u01CD\u01CB\x03\x02\x02\x02', '\u01CE\u01CF\x07C\x02\x02\u01CF\u01D1\x03\x02\x02\x02', '\u01D0\u01C5\x03\x02\x02\x02\u01D0\u01D1\x03\x02\x02\x02', '\u01D1\u01D2\x03\x02\x02\x02\u01D2\u01D3\x07@\x02\x02', '\u01D3\u01D4\x05@!\x02\u01D4\u01D5\x07A\x02\x02\u01D5\u01E1', '\x03\x02\x02\x02\u01D6\u01D7\x07B\x02\x02\u01D7\u01D8', '\x050\x19\x02\u01D8\u01D9\x07?\x02\x02\u01D9\u01DA\x05', '0\x19\x02\u01DA\u01DB\x07C\x02\x02\u01DB\u01E1\x03\x02', '\x02\x02\u01DC\u01DD\x07@\x02\x02\u01DD\u01DE\x050\x19', '\x02\u01DE\u01DF\x07A\x02\x02\u01DF\u01E1\x03\x02\x02', '\x02\u01E0\u01B3\x03\x02\x02\x02\u01E0\u01BC\x03\x02\x02', '\x02\u01E0\u01BD\x03\x02\x02\x02\u01E0\u01C1\x03\x02\x02', '\x02\u01E0\u01C4\x03\x02\x02\x02\u01E0\u01D6\x03\x02\x02', '\x02\u01E0\u01DC\x03\x02\x02\x02\u01E1\u01E7\x03\x02\x02', '\x02\u01E2\u01E3\f\t\x02\x02\u01E3\u01E4\x07>\x02\x02\u01E4', '\u01E6\x05<\x1F\x02\u01E5\u01E2\x03\x02\x02\x02\u01E6', '\u01E9\x03\x02\x02\x02\u01E7\u01E5\x03\x02\x02\x02\u01E7', '\u01E8\x03\x02\x02\x02\u01E8?\x03\x02\x02\x02\u01E9', '\u01E7\x03\x02\x02\x02\u01EA\u01F6\x05T+\x02\u01EB\u01ED', '\x07I\x02\x02\u01EC\u01EE\x050\x19\x02\u01ED\u01EC\x03', '\x02\x02\x02\u01ED\u01EE\x03\x02\x02\x02\u01EE\u01F4\x03', '\x02\x02\x02\u01EF\u01F0\x07I\x02\x02\u01F0\u01F2\x05', 'X-\x02\u01F1\u01F3\x05\\/\x02\u01F2\u01F1\x03\x02\x02\x02', '\u01F2\u01F3\x03\x02\x02\x02\u01F3\u01F5\x03\x02\x02\x02', '\u01F4\u01EF\x03\x02\x02\x02\u01F4\u01F5\x03\x02\x02\x02', '\u01F5\u01F7\x03\x02\x02\x02\u01F6\u01EB\x03\x02\x02\x02', '\u01F6\u01F7\x03\x02\x02\x02\u01F7\u01FD\x03\x02\x02\x02', '\u01F8\u01FA\x05X-\x02\u01F9\u01FB\x05\\/\x02\u01FA\u01F9\x03', '\x02\x02\x02\u01FA\u01FB\x03\x02\x02\x02\u01FB\u01FD\x03', '\x02\x02\x02\u01FC\u01EA\x03\x02\x02\x02\u01FC\u01F8\x03', '\x02\x02\x02\u01FDA\x03\x02\x02\x02\u01FE\u0203\x07', 'O\x02\x02\u01FF\u0203\x07P\x02\x02\u0200\u0203\x05D#\x02', '\u0201\u0203\x07Q\x02\x02\u0202\u01FE\x03\x02\x02\x02', '\u0202\u01FF\x03\x02\x02\x02\u0202\u0200\x03\x02\x02\x02', '\u0202\u0201\x03\x02\x02\x02\u0203C\x03\x02\x02\x02', '\u0204\u0205\t\x04\x02\x02\u0205E\x03\x02\x02\x02\u0206', '\u020A\x070\x02\x02\u0207\u020A\x07&\x02\x02\u0208\u020A', '\x05\x86D\x02\u0209\u0206\x03\x02\x02\x02\u0209\u0207', '\x03\x02\x02\x02\u0209\u0208\x03\x02\x02\x02\u020AG', '\x03\x02\x02\x02\u020B\u020C\t\x05\x02\x02\u020CI\x03', '\x02\x02\x02\u020D\u020E\t\x06\x02\x02\u020EK\x03\x02', '\x02\x02\u020F\u0210\t\x07\x02\x02\u0210M\x03\x02\x02', '\x02\u0211\u0212\t\x06\x02\x02\u0212O\x03\x02\x02\x02', '\u0213\u0214\t\b\x02\x02\u0214Q\x03\x02\x02\x02\u0215\u0216', '\t\t\x02\x02\u0216S\x03\x02\x02\x02\u0217\u021C\x05V,', '\x02\u0218\u0219\x07:\x02\x02\u0219\u021B\x05V,\x02\u021A', '\u0218\x03\x02\x02\x02\u021B\u021E\x03\x02\x02\x02\u021C', '\u021A\x03\x02\x02\x02\u021C\u021D\x03\x02\x02\x02\u021D', '\u0220\x03\x02\x02\x02\u021E\u021C\x03\x02\x02\x02\u021F', '\u0217\x03\x02\x02\x02\u021F\u0220\x03\x02\x02\x02\u0220', 'U\x03\x02\x02\x02\u0221\u0222\x05~@\x02\u0222\u0223\x05', '\x86D\x02\u0223W\x03\x02\x02\x02\u0224\u0229\x05Z.\x02', '\u0225\u0226\x07:\x02\x02\u0226\u0228\x05Z.\x02\u0227\u0225', '\x03\x02\x02\x02\u0228\u022B\x03\x02\x02\x02\u0229\u0227', '\x03\x02\x02\x02\u0229\u022A\x03\x02\x02\x02\u022AY', '\x03\x02\x02\x02\u022B\u0229\x03\x02\x02\x02\u022C\u022F', '\x050\x19\x02\u022D\u022E\x07\x05\x02\x02\u022E\u0230', '\x05d3\x02\u022F\u022D\x03\x02\x02\x02\u022F\u0230\x03', '\x02\x02\x02\u0230[\x03\x02\x02\x02\u0231\u0232\x07', '#\x02\x02\u0232\u0233\x07\t\x02\x02\u0233\u0238\x05^0\x02', '\u0234\u0235\x07:\x02\x02\u0235\u0237\x05^0\x02\u0236\u0234', '\x03\x02\x02\x02\u0237\u023A\x03\x02\x02\x02\u0238\u0236', '\x03\x02\x02\x02\u0238\u0239\x03\x02\x02\x02\u0239]', '\x03\x02\x02\x02\u023A\u0238\x03\x02\x02\x02\u023B\u023D', '\x050\x19\x02\u023C\u023E\x05R*\x02\u023D\u023C\x03\x02', '\x02\x02\u023D\u023E\x03\x02\x02\x02\u023E_\x03\x02', '\x02\x02\u023F\u0243\x07U\x02\x02\u0240\u0242\x05b2\x02', '\u0241\u0240\x03\x02\x02\x02\u0242\u0245\x03\x02\x02\x02', '\u0243\u0241\x03\x02\x02\x02\u0243\u0244\x03\x02\x02\x02', '\u0244\u0246\x03\x02\x02\x02\u0245\u0243\x03\x02\x02\x02', '\u0246\u0247\x07V\x02\x02\u0247a\x03\x02\x02\x02\u0248', '\u0249\x07W\x02\x02\u0249c\x03\x02\x02\x02\u024A\u024B', '\t\n\x02\x02\u024Be\x03\x02\x02\x02\u024C\u024D\t\x0B', '\x02\x02\u024Dg\x03\x02\x02\x02\u024E\u025C\x05j6\x02', '\u024F\u0250\x05j6\x02\u0250\u0251\x07B\x02\x02\u0251\u0256', '\x05l7\x02\u0252\u0253\x07:\x02\x02\u0253\u0255\x05l7\x02', '\u0254\u0252\x03\x02\x02\x02\u0255\u0258\x03\x02\x02\x02', '\u0256\u0254\x03\x02\x02\x02\u0256\u0257\x03\x02\x02\x02', '\u0257\u0259\x03\x02\x02\x02\u0258\u0256\x03\x02\x02\x02', '\u0259\u025A\x07C\x02\x02\u025A\u025C\x03\x02\x02\x02', '\u025B\u024E\x03\x02\x02\x02\u025B\u024F\x03\x02\x02\x02', '\u025Ci\x03\x02\x02\x02\u025D\u025E\x07K\x02\x02\u025E', 'k\x03\x02\x02\x02\u025F\u0263\x05d3\x02\u0260\u0263\x07', '0\x02\x02\u0261\u0263\x07&\x02\x02\u0262\u025F\x03\x02', '\x02\x02\u0262\u0260\x03\x02\x02\x02\u0262\u0261\x03\x02', '\x02\x02\u0263m\x03\x02\x02\x02\u0264\u0265\x05d3\x02', '\u0265o\x03\x02\x02\x02\u0266\u026B\x05d3\x02\u0267\u0268', '\x07>\x02\x02\u0268\u026A\x05d3\x02\u0269\u0267\x03\x02', '\x02\x02\u026A\u026D\x03\x02\x02\x02\u026B\u0269\x03\x02', '\x02\x02\u026B\u026C\x03\x02\x02\x02\u026Cq\x03\x02', '\x02\x02\u026D\u026B\x03\x02\x02\x02\u026E\u0273\x05p', '9\x02\u026F\u0270\x07J\x02\x02\u0270\u0272\x05d3\x02\u0271', '\u026F\x03\x02\x02\x02\u0272\u0275\x03\x02\x02\x02\u0273', '\u0271\x03\x02\x02\x02\u0273\u0274\x03\x02\x02\x02\u0274', 's\x03\x02\x02\x02\u0275\u0273\x03\x02\x02\x02\u0276', '\u027B\x05d3\x02\u0277\u0278\x07J\x02\x02\u0278\u027A\x05', 'd3\x02\u0279\u0277\x03\x02\x02\x02\u027A\u027D\x03\x02', '\x02\x02\u027B\u0279\x03\x02\x02\x02\u027B\u027C\x03\x02', '\x02\x02\u027Cu\x03\x02\x02\x02\u027D\u027B\x03\x02', '\x02\x02\u027E\u027F\t\f\x02\x02\u027Fw\x03\x02\x02\x02', '\u0280\u0281\x07L\x02\x02\u0281y\x03\x02\x02\x02\u0282', '\u0283\x07M\x02\x02\u0283{\x03\x02\x02\x02\u0284\u0287', '\x07$\x02\x02\u0285\u0287\x05~@\x02\u0286\u0284\x03\x02', '\x02\x02\u0286\u0285\x03\x02\x02\x02\u0287}\x03\x02', '\x02\x02\u0288\u0289\x05t;\x02\u0289\u028A\x07J\x02\x02', '\u028A\u028C\x03\x02\x02\x02\u028B\u0288\x03\x02\x02\x02', '\u028B\u028C\x03\x02\x02\x02\u028C\u028D\x03\x02\x02\x02', '\u028D\u0290\x07L\x02\x02\u028E\u0290\x05v<\x02\u028F\u028B', '\x03\x02\x02\x02\u028F\u028E\x03\x02\x02\x02\u0290\x7F', '\x03\x02\x02\x02\u0291\u0292\x07K\x02\x02\u0292\x81', '\x03\x02\x02\x02\u0293\u0294\x05t;\x02\u0294\u0295\x07', 'J\x02\x02\u0295\u0297\x03\x02\x02\x02\u0296\u0293\x03', '\x02\x02\x02\u0296\u0297\x03\x02\x02\x02\u0297\u0298\x03', '\x02\x02\x02\u0298\u0299\x05f4\x02\u0299\x83\x03\x02', '\x02\x02\u029A\u029B\x05\x82B\x02\u029B\u029C\x07=\x02', '\x02\u029C\u029D\x07O\x02\x02\u029D\x85\x03\x02\x02', '\x02\u029E\u029F\x05d3\x02\u029F\x87\x03\x02\x02\x02', '\u02A0\u02A1\t\r\x02\x02\u02A1\x89\x03\x02\x02\x02C\x94', '\x99\x9F\xA8\xAB\xB1\xC7\xD3\xD7\xDC\xE7\xEB\xEF', '\xF4\xFE\u0105\u010B\u0110\u0116\u0119\u012F\u013F\u0142\u0165\u0182', '\u0184\u018E\u0190\u0193\u0199\u01A0\u01A3\u01A7\u01B1\u01B6\u01C1\u01CB', '\u01D0\u01E0\u01E7\u01ED\u01F2\u01F4\u01F6\u01FA\u01FC\u0202\u0209\u021C', '\u021F\u0229\u022F\u0238\u023D\u0243\u0256\u025B\u0262\u026B\u0273\u027B', '\u0286\u028B\u028F\u0296'].join("");

	var atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

	var decisionsToDFA = atn.decisionToState.map(function (ds, index) {
	    return new antlr4.dfa.DFA(ds, index);
	});

	var sharedContextCache = new antlr4.PredictionContextCache();

	var literalNames = [null, "'and'", "'any'", "'as'", "'asc'", "'avg'", "'boolean'", "'by'", "'class'", "'newtype'", "'count'", "'date'", "'desc'", "'else'", "'exists'", "'extends'", "'false'", "'float'", "'forall'", "'forex'", "'from'", "'if'", "'implies'", "'import'", "'in'", "'instanceof'", "'int'", "'max'", "'min'", "'module'", "'not'", "'none'", "'or'", "'order'", "'predicate'", "'rank'", "'result'", "'select'", "'strictcount'", "'strictsum'", "'strictconcat'", "'concat'", "'string'", "'sum'", "'super'", "'then'", "'this'", "'true'", "'where'", "'<'", "'<='", "'='", "'>'", "'>='", "'_'", "'-'", "','", "';'", "'!='", "'/'", "'.'", "'..'", "'('", "')'", "'['", "']'", "'{'", "'}'", "'*'", "'%'", "'+'", "'|'", "'::'", null, null, null, null, null, null, null, null, null, null, "'/**'", "'*/'"];

	var symbolicNames = [null, "AND", "ANY", "AS", "ASC", "AVG", "BOOLEAN", "BY", "CLASS", "NEWTYPE", "COUNT", "DATE", "DESC", "ELSE", "EXISTS", "EXTENDS", "FALSE", "FLOAT", "FORALL", "FOREX", "FROM", "IF", "IMPLIES", "IMPORT", "IN", "INSTANCEOF", "INT", "MAX", "MIN", "MODULE", "NOT", "NONE", "OR", "ORDER", "PREDICATE", "RANK", "RESULT", "SELECT", "STRICTCOUNT", "STRICTSUM", "STRICTCONCAT", "CONCAT", "STRING", "SUM", "SUPER", "THEN", "THIS", "TRUE", "WHERE", "LT", "LE", "EQ", "GT", "GE", "UNDERSCORE", "MINUS", "COMMA", "SEMI", "NE", "SLASH", "DOT", "RANGE", "OPAR", "CPAR", "OBLOCK", "CBLOCK", "OBRACE", "CBRACE", "STAR", "MOD", "PLUS", "BAR", "SELECTION", "Lowerid", "Upperid", "Atlowerid", "Atupperid", "Integer", "Float", "String", "WS", "COMMENT", "LINE_COMMENT", "StartQLDoc", "EndQLDoc", "CONTENT"];

	var ruleNames = ["fileModule", "module", "moduleBody", "moduleMember", "imprt", "moduleAliasBody", "predicateAliasBody", "typeAliasBody", "classlessPredicate", "datatype", "datatypeBranches", "datatypeBranch", "branchBody", "select", "dataclass", "classMember", "charpred", "memberPredicate", "field", "optbody", "empty", "body", "higherOrderTerm", "exprOrTerm", "specialId", "quantBody", "quantifier", "callArg", "callArgs", "qualifiedRhs", "primary", "aggBody", "literal", "bool", "variable", "compop", "unop", "mulop", "addop", "closure", "direction", "varDecls", "varDecl", "asExprs", "asExpr", "orderBys", "orderBy", "qldoc", "qldocSegment", "simpleId", "literalId", "annotation", "annotName", "annotArg", "moduleName", "qualModuleExpr", "importModuleExpr", "moduleExpr", "typeLiteral", "className", "dbtype", "returnType", "typeExpr", "predicateName", "aritylessPredicateExpr", "predicateExpr", "varName", "aggId"];

	function QLParser(input) {
	    antlr4.Parser.call(this, input);
	    this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
	    this.ruleNames = ruleNames;
	    this.literalNames = literalNames;
	    this.symbolicNames = symbolicNames;
	    return this;
	}

	QLParser.prototype = Object.create(antlr4.Parser.prototype);
	QLParser.prototype.constructor = QLParser;

	Object.defineProperty(QLParser.prototype, "atn", {
	    get: function get() {
	        return atn;
	    }
	});

	QLParser.EOF = antlr4.Token.EOF;
	QLParser.AND = 1;
	QLParser.ANY = 2;
	QLParser.AS = 3;
	QLParser.ASC = 4;
	QLParser.AVG = 5;
	QLParser.BOOLEAN = 6;
	QLParser.BY = 7;
	QLParser.CLASS = 8;
	QLParser.NEWTYPE = 9;
	QLParser.COUNT = 10;
	QLParser.DATE = 11;
	QLParser.DESC = 12;
	QLParser.ELSE = 13;
	QLParser.EXISTS = 14;
	QLParser.EXTENDS = 15;
	QLParser.FALSE = 16;
	QLParser.FLOAT = 17;
	QLParser.FORALL = 18;
	QLParser.FOREX = 19;
	QLParser.FROM = 20;
	QLParser.IF = 21;
	QLParser.IMPLIES = 22;
	QLParser.IMPORT = 23;
	QLParser.IN = 24;
	QLParser.INSTANCEOF = 25;
	QLParser.INT = 26;
	QLParser.MAX = 27;
	QLParser.MIN = 28;
	QLParser.MODULE = 29;
	QLParser.NOT = 30;
	QLParser.NONE = 31;
	QLParser.OR = 32;
	QLParser.ORDER = 33;
	QLParser.PREDICATE = 34;
	QLParser.RANK = 35;
	QLParser.RESULT = 36;
	QLParser.SELECT = 37;
	QLParser.STRICTCOUNT = 38;
	QLParser.STRICTSUM = 39;
	QLParser.STRICTCONCAT = 40;
	QLParser.CONCAT = 41;
	QLParser.STRING = 42;
	QLParser.SUM = 43;
	QLParser.SUPER = 44;
	QLParser.THEN = 45;
	QLParser.THIS = 46;
	QLParser.TRUE = 47;
	QLParser.WHERE = 48;
	QLParser.LT = 49;
	QLParser.LE = 50;
	QLParser.EQ = 51;
	QLParser.GT = 52;
	QLParser.GE = 53;
	QLParser.UNDERSCORE = 54;
	QLParser.MINUS = 55;
	QLParser.COMMA = 56;
	QLParser.SEMI = 57;
	QLParser.NE = 58;
	QLParser.SLASH = 59;
	QLParser.DOT = 60;
	QLParser.RANGE = 61;
	QLParser.OPAR = 62;
	QLParser.CPAR = 63;
	QLParser.OBLOCK = 64;
	QLParser.CBLOCK = 65;
	QLParser.OBRACE = 66;
	QLParser.CBRACE = 67;
	QLParser.STAR = 68;
	QLParser.MOD = 69;
	QLParser.PLUS = 70;
	QLParser.BAR = 71;
	QLParser.SELECTION = 72;
	QLParser.Lowerid = 73;
	QLParser.Upperid = 74;
	QLParser.Atlowerid = 75;
	QLParser.Atupperid = 76;
	QLParser.Integer = 77;
	QLParser.Float = 78;
	QLParser.String = 79;
	QLParser.WS = 80;
	QLParser.COMMENT = 81;
	QLParser.LINE_COMMENT = 82;
	QLParser.StartQLDoc = 83;
	QLParser.EndQLDoc = 84;
	QLParser.CONTENT = 85;

	QLParser.RULE_fileModule = 0;
	QLParser.RULE_module = 1;
	QLParser.RULE_moduleBody = 2;
	QLParser.RULE_moduleMember = 3;
	QLParser.RULE_imprt = 4;
	QLParser.RULE_moduleAliasBody = 5;
	QLParser.RULE_predicateAliasBody = 6;
	QLParser.RULE_typeAliasBody = 7;
	QLParser.RULE_classlessPredicate = 8;
	QLParser.RULE_datatype = 9;
	QLParser.RULE_datatypeBranches = 10;
	QLParser.RULE_datatypeBranch = 11;
	QLParser.RULE_branchBody = 12;
	QLParser.RULE_select = 13;
	QLParser.RULE_dataclass = 14;
	QLParser.RULE_classMember = 15;
	QLParser.RULE_charpred = 16;
	QLParser.RULE_memberPredicate = 17;
	QLParser.RULE_field = 18;
	QLParser.RULE_optbody = 19;
	QLParser.RULE_empty = 20;
	QLParser.RULE_body = 21;
	QLParser.RULE_higherOrderTerm = 22;
	QLParser.RULE_exprOrTerm = 23;
	QLParser.RULE_specialId = 24;
	QLParser.RULE_quantBody = 25;
	QLParser.RULE_quantifier = 26;
	QLParser.RULE_callArg = 27;
	QLParser.RULE_callArgs = 28;
	QLParser.RULE_qualifiedRhs = 29;
	QLParser.RULE_primary = 30;
	QLParser.RULE_aggBody = 31;
	QLParser.RULE_literal = 32;
	QLParser.RULE_bool = 33;
	QLParser.RULE_variable = 34;
	QLParser.RULE_compop = 35;
	QLParser.RULE_unop = 36;
	QLParser.RULE_mulop = 37;
	QLParser.RULE_addop = 38;
	QLParser.RULE_closure = 39;
	QLParser.RULE_direction = 40;
	QLParser.RULE_varDecls = 41;
	QLParser.RULE_varDecl = 42;
	QLParser.RULE_asExprs = 43;
	QLParser.RULE_asExpr = 44;
	QLParser.RULE_orderBys = 45;
	QLParser.RULE_orderBy = 46;
	QLParser.RULE_qldoc = 47;
	QLParser.RULE_qldocSegment = 48;
	QLParser.RULE_simpleId = 49;
	QLParser.RULE_literalId = 50;
	QLParser.RULE_annotation = 51;
	QLParser.RULE_annotName = 52;
	QLParser.RULE_annotArg = 53;
	QLParser.RULE_moduleName = 54;
	QLParser.RULE_qualModuleExpr = 55;
	QLParser.RULE_importModuleExpr = 56;
	QLParser.RULE_moduleExpr = 57;
	QLParser.RULE_typeLiteral = 58;
	QLParser.RULE_className = 59;
	QLParser.RULE_dbtype = 60;
	QLParser.RULE_returnType = 61;
	QLParser.RULE_typeExpr = 62;
	QLParser.RULE_predicateName = 63;
	QLParser.RULE_aritylessPredicateExpr = 64;
	QLParser.RULE_predicateExpr = 65;
	QLParser.RULE_varName = 66;
	QLParser.RULE_aggId = 67;

	function FileModuleContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_fileModule;
	    return this;
	}

	FileModuleContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	FileModuleContext.prototype.constructor = FileModuleContext;

	FileModuleContext.prototype.moduleBody = function () {
	    return this.getTypedRuleContext(ModuleBodyContext, 0);
	};

	FileModuleContext.prototype.EOF = function () {
	    return this.getToken(QLParser.EOF, 0);
	};

	FileModuleContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitFileModule(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.FileModuleContext = FileModuleContext;

	QLParser.prototype.fileModule = function () {

	    var localctx = new FileModuleContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 0, QLParser.RULE_fileModule);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 136;
	        this.moduleBody();
	        this.state = 137;
	        this.match(QLParser.EOF);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ModuleContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_module;
	    return this;
	}

	ModuleContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ModuleContext.prototype.constructor = ModuleContext;

	ModuleContext.prototype.MODULE = function () {
	    return this.getToken(QLParser.MODULE, 0);
	};

	ModuleContext.prototype.moduleName = function () {
	    return this.getTypedRuleContext(ModuleNameContext, 0);
	};

	ModuleContext.prototype.OBRACE = function () {
	    return this.getToken(QLParser.OBRACE, 0);
	};

	ModuleContext.prototype.moduleBody = function () {
	    return this.getTypedRuleContext(ModuleBodyContext, 0);
	};

	ModuleContext.prototype.CBRACE = function () {
	    return this.getToken(QLParser.CBRACE, 0);
	};

	ModuleContext.prototype.moduleAliasBody = function () {
	    return this.getTypedRuleContext(ModuleAliasBodyContext, 0);
	};

	ModuleContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitModule(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ModuleContext = ModuleContext;

	QLParser.prototype.module = function () {

	    var localctx = new ModuleContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 2, QLParser.RULE_module);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 139;
	        this.match(QLParser.MODULE);
	        this.state = 140;
	        this.moduleName();
	        this.state = 146;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.OBRACE:
	                this.state = 141;
	                this.match(QLParser.OBRACE);
	                this.state = 142;
	                this.moduleBody();
	                this.state = 143;
	                this.match(QLParser.CBRACE);
	                break;
	            case QLParser.EQ:
	                this.state = 145;
	                this.moduleAliasBody();
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ModuleBodyContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_moduleBody;
	    return this;
	}

	ModuleBodyContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ModuleBodyContext.prototype.constructor = ModuleBodyContext;

	ModuleBodyContext.prototype.moduleMember = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ModuleMemberContext);
	    } else {
	        return this.getTypedRuleContext(ModuleMemberContext, i);
	    }
	};

	ModuleBodyContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitModuleBody(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ModuleBodyContext = ModuleBodyContext;

	QLParser.prototype.moduleBody = function () {

	    var localctx = new ModuleBodyContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 4, QLParser.RULE_moduleBody);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 151;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while ((_la & ~0x1f) == 0 && (1 << _la & (1 << QLParser.BOOLEAN | 1 << QLParser.CLASS | 1 << QLParser.NEWTYPE | 1 << QLParser.DATE | 1 << QLParser.FLOAT | 1 << QLParser.FROM | 1 << QLParser.IMPORT | 1 << QLParser.INT | 1 << QLParser.MODULE)) !== 0 || (_la - 34 & ~0x1f) == 0 && (1 << _la - 34 & (1 << QLParser.PREDICATE - 34 | 1 << QLParser.SELECT - 34 | 1 << QLParser.STRING - 34 | 1 << QLParser.WHERE - 34)) !== 0 || (_la - 73 & ~0x1f) == 0 && (1 << _la - 73 & (1 << QLParser.Lowerid - 73 | 1 << QLParser.Upperid - 73 | 1 << QLParser.Atlowerid - 73 | 1 << QLParser.StartQLDoc - 73)) !== 0) {
	            this.state = 148;
	            this.moduleMember();
	            this.state = 153;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ModuleMemberContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_moduleMember;
	    return this;
	}

	ModuleMemberContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ModuleMemberContext.prototype.constructor = ModuleMemberContext;

	ModuleMemberContext.prototype.imprt = function () {
	    return this.getTypedRuleContext(ImprtContext, 0);
	};

	ModuleMemberContext.prototype.classlessPredicate = function () {
	    return this.getTypedRuleContext(ClasslessPredicateContext, 0);
	};

	ModuleMemberContext.prototype.dataclass = function () {
	    return this.getTypedRuleContext(DataclassContext, 0);
	};

	ModuleMemberContext.prototype.datatype = function () {
	    return this.getTypedRuleContext(DatatypeContext, 0);
	};

	ModuleMemberContext.prototype.select = function () {
	    return this.getTypedRuleContext(SelectContext, 0);
	};

	ModuleMemberContext.prototype.module = function () {
	    return this.getTypedRuleContext(ModuleContext, 0);
	};

	ModuleMemberContext.prototype.annotation = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(AnnotationContext);
	    } else {
	        return this.getTypedRuleContext(AnnotationContext, i);
	    }
	};

	ModuleMemberContext.prototype.qldoc = function () {
	    return this.getTypedRuleContext(QldocContext, 0);
	};

	ModuleMemberContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitModuleMember(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ModuleMemberContext = ModuleMemberContext;

	QLParser.prototype.moduleMember = function () {

	    var localctx = new ModuleMemberContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 6, QLParser.RULE_moduleMember);
	    try {
	        this.state = 169;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.BOOLEAN:
	            case QLParser.CLASS:
	            case QLParser.NEWTYPE:
	            case QLParser.DATE:
	            case QLParser.FLOAT:
	            case QLParser.FROM:
	            case QLParser.IMPORT:
	            case QLParser.INT:
	            case QLParser.MODULE:
	            case QLParser.PREDICATE:
	            case QLParser.SELECT:
	            case QLParser.STRING:
	            case QLParser.WHERE:
	            case QLParser.Lowerid:
	            case QLParser.Upperid:
	            case QLParser.Atlowerid:
	                this.enterOuterAlt(localctx, 1);
	                this.state = 157;
	                this._errHandler.sync(this);
	                var _alt = this._interp.adaptivePredict(this._input, 2, this._ctx);
	                while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	                    if (_alt === 1) {
	                        this.state = 154;
	                        this.annotation();
	                    }
	                    this.state = 159;
	                    this._errHandler.sync(this);
	                    _alt = this._interp.adaptivePredict(this._input, 2, this._ctx);
	                }

	                this.state = 166;
	                this._errHandler.sync(this);
	                switch (this._input.LA(1)) {
	                    case QLParser.IMPORT:
	                        this.state = 160;
	                        this.imprt();
	                        break;
	                    case QLParser.BOOLEAN:
	                    case QLParser.DATE:
	                    case QLParser.FLOAT:
	                    case QLParser.INT:
	                    case QLParser.PREDICATE:
	                    case QLParser.STRING:
	                    case QLParser.Lowerid:
	                    case QLParser.Upperid:
	                    case QLParser.Atlowerid:
	                        this.state = 161;
	                        this.classlessPredicate();
	                        break;
	                    case QLParser.CLASS:
	                        this.state = 162;
	                        this.dataclass();
	                        break;
	                    case QLParser.NEWTYPE:
	                        this.state = 163;
	                        this.datatype();
	                        break;
	                    case QLParser.FROM:
	                    case QLParser.SELECT:
	                    case QLParser.WHERE:
	                        this.state = 164;
	                        this.select();
	                        break;
	                    case QLParser.MODULE:
	                        this.state = 165;
	                        this.module();
	                        break;
	                    default:
	                        throw new antlr4.error.NoViableAltException(this);
	                }
	                break;
	            case QLParser.StartQLDoc:
	                this.enterOuterAlt(localctx, 2);
	                this.state = 168;
	                this.qldoc();
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ImprtContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_imprt;
	    return this;
	}

	ImprtContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ImprtContext.prototype.constructor = ImprtContext;

	ImprtContext.prototype.IMPORT = function () {
	    return this.getToken(QLParser.IMPORT, 0);
	};

	ImprtContext.prototype.importModuleExpr = function () {
	    return this.getTypedRuleContext(ImportModuleExprContext, 0);
	};

	ImprtContext.prototype.AS = function () {
	    return this.getToken(QLParser.AS, 0);
	};

	ImprtContext.prototype.moduleName = function () {
	    return this.getTypedRuleContext(ModuleNameContext, 0);
	};

	ImprtContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitImprt(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ImprtContext = ImprtContext;

	QLParser.prototype.imprt = function () {

	    var localctx = new ImprtContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 8, QLParser.RULE_imprt);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 171;
	        this.match(QLParser.IMPORT);
	        this.state = 172;
	        this.importModuleExpr();
	        this.state = 175;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if (_la === QLParser.AS) {
	            this.state = 173;
	            this.match(QLParser.AS);
	            this.state = 174;
	            this.moduleName();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ModuleAliasBodyContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_moduleAliasBody;
	    return this;
	}

	ModuleAliasBodyContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ModuleAliasBodyContext.prototype.constructor = ModuleAliasBodyContext;

	ModuleAliasBodyContext.prototype.EQ = function () {
	    return this.getToken(QLParser.EQ, 0);
	};

	ModuleAliasBodyContext.prototype.moduleExpr = function () {
	    return this.getTypedRuleContext(ModuleExprContext, 0);
	};

	ModuleAliasBodyContext.prototype.SEMI = function () {
	    return this.getToken(QLParser.SEMI, 0);
	};

	ModuleAliasBodyContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitModuleAliasBody(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ModuleAliasBodyContext = ModuleAliasBodyContext;

	QLParser.prototype.moduleAliasBody = function () {

	    var localctx = new ModuleAliasBodyContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 10, QLParser.RULE_moduleAliasBody);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 177;
	        this.match(QLParser.EQ);
	        this.state = 178;
	        this.moduleExpr();
	        this.state = 179;
	        this.match(QLParser.SEMI);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function PredicateAliasBodyContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_predicateAliasBody;
	    return this;
	}

	PredicateAliasBodyContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	PredicateAliasBodyContext.prototype.constructor = PredicateAliasBodyContext;

	PredicateAliasBodyContext.prototype.EQ = function () {
	    return this.getToken(QLParser.EQ, 0);
	};

	PredicateAliasBodyContext.prototype.predicateExpr = function () {
	    return this.getTypedRuleContext(PredicateExprContext, 0);
	};

	PredicateAliasBodyContext.prototype.SEMI = function () {
	    return this.getToken(QLParser.SEMI, 0);
	};

	PredicateAliasBodyContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitPredicateAliasBody(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.PredicateAliasBodyContext = PredicateAliasBodyContext;

	QLParser.prototype.predicateAliasBody = function () {

	    var localctx = new PredicateAliasBodyContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 12, QLParser.RULE_predicateAliasBody);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 181;
	        this.match(QLParser.EQ);
	        this.state = 182;
	        this.predicateExpr();
	        this.state = 183;
	        this.match(QLParser.SEMI);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function TypeAliasBodyContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_typeAliasBody;
	    return this;
	}

	TypeAliasBodyContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	TypeAliasBodyContext.prototype.constructor = TypeAliasBodyContext;

	TypeAliasBodyContext.prototype.EQ = function () {
	    return this.getToken(QLParser.EQ, 0);
	};

	TypeAliasBodyContext.prototype.typeExpr = function () {
	    return this.getTypedRuleContext(TypeExprContext, 0);
	};

	TypeAliasBodyContext.prototype.SEMI = function () {
	    return this.getToken(QLParser.SEMI, 0);
	};

	TypeAliasBodyContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitTypeAliasBody(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.TypeAliasBodyContext = TypeAliasBodyContext;

	QLParser.prototype.typeAliasBody = function () {

	    var localctx = new TypeAliasBodyContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 14, QLParser.RULE_typeAliasBody);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 185;
	        this.match(QLParser.EQ);
	        this.state = 186;
	        this.typeExpr();
	        this.state = 187;
	        this.match(QLParser.SEMI);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ClasslessPredicateContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_classlessPredicate;
	    return this;
	}

	ClasslessPredicateContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ClasslessPredicateContext.prototype.constructor = ClasslessPredicateContext;

	ClasslessPredicateContext.prototype.returnType = function () {
	    return this.getTypedRuleContext(ReturnTypeContext, 0);
	};

	ClasslessPredicateContext.prototype.predicateName = function () {
	    return this.getTypedRuleContext(PredicateNameContext, 0);
	};

	ClasslessPredicateContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	ClasslessPredicateContext.prototype.varDecls = function () {
	    return this.getTypedRuleContext(VarDeclsContext, 0);
	};

	ClasslessPredicateContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};

	ClasslessPredicateContext.prototype.optbody = function () {
	    return this.getTypedRuleContext(OptbodyContext, 0);
	};

	ClasslessPredicateContext.prototype.predicateAliasBody = function () {
	    return this.getTypedRuleContext(PredicateAliasBodyContext, 0);
	};

	ClasslessPredicateContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitClasslessPredicate(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ClasslessPredicateContext = ClasslessPredicateContext;

	QLParser.prototype.classlessPredicate = function () {

	    var localctx = new ClasslessPredicateContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 16, QLParser.RULE_classlessPredicate);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 189;
	        this.returnType();
	        this.state = 190;
	        this.predicateName();
	        this.state = 197;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.OPAR:
	                this.state = 191;
	                this.match(QLParser.OPAR);
	                this.state = 192;
	                this.varDecls();
	                this.state = 193;
	                this.match(QLParser.CPAR);
	                this.state = 194;
	                this.optbody();
	                break;
	            case QLParser.EQ:
	                this.state = 196;
	                this.predicateAliasBody();
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function DatatypeContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_datatype;
	    return this;
	}

	DatatypeContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	DatatypeContext.prototype.constructor = DatatypeContext;

	DatatypeContext.prototype.NEWTYPE = function () {
	    return this.getToken(QLParser.NEWTYPE, 0);
	};

	DatatypeContext.prototype.className = function () {
	    return this.getTypedRuleContext(ClassNameContext, 0);
	};

	DatatypeContext.prototype.EQ = function () {
	    return this.getToken(QLParser.EQ, 0);
	};

	DatatypeContext.prototype.datatypeBranches = function () {
	    return this.getTypedRuleContext(DatatypeBranchesContext, 0);
	};

	DatatypeContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitDatatype(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.DatatypeContext = DatatypeContext;

	QLParser.prototype.datatype = function () {

	    var localctx = new DatatypeContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 18, QLParser.RULE_datatype);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 199;
	        this.match(QLParser.NEWTYPE);
	        this.state = 200;
	        this.className();
	        this.state = 201;
	        this.match(QLParser.EQ);
	        this.state = 202;
	        this.datatypeBranches();
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function DatatypeBranchesContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_datatypeBranches;
	    return this;
	}

	DatatypeBranchesContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	DatatypeBranchesContext.prototype.constructor = DatatypeBranchesContext;

	DatatypeBranchesContext.prototype.datatypeBranch = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(DatatypeBranchContext);
	    } else {
	        return this.getTypedRuleContext(DatatypeBranchContext, i);
	    }
	};

	DatatypeBranchesContext.prototype.OR = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.OR);
	    } else {
	        return this.getToken(QLParser.OR, i);
	    }
	};

	DatatypeBranchesContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitDatatypeBranches(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.DatatypeBranchesContext = DatatypeBranchesContext;

	QLParser.prototype.datatypeBranches = function () {

	    var localctx = new DatatypeBranchesContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 20, QLParser.RULE_datatypeBranches);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 204;
	        this.datatypeBranch();
	        this.state = 209;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while (_la === QLParser.OR) {
	            this.state = 205;
	            this.match(QLParser.OR);
	            this.state = 206;
	            this.datatypeBranch();
	            this.state = 211;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function DatatypeBranchContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_datatypeBranch;
	    return this;
	}

	DatatypeBranchContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	DatatypeBranchContext.prototype.constructor = DatatypeBranchContext;

	DatatypeBranchContext.prototype.className = function () {
	    return this.getTypedRuleContext(ClassNameContext, 0);
	};

	DatatypeBranchContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	DatatypeBranchContext.prototype.varDecls = function () {
	    return this.getTypedRuleContext(VarDeclsContext, 0);
	};

	DatatypeBranchContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};

	DatatypeBranchContext.prototype.branchBody = function () {
	    return this.getTypedRuleContext(BranchBodyContext, 0);
	};

	DatatypeBranchContext.prototype.qldoc = function () {
	    return this.getTypedRuleContext(QldocContext, 0);
	};

	DatatypeBranchContext.prototype.annotation = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(AnnotationContext);
	    } else {
	        return this.getTypedRuleContext(AnnotationContext, i);
	    }
	};

	DatatypeBranchContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitDatatypeBranch(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.DatatypeBranchContext = DatatypeBranchContext;

	QLParser.prototype.datatypeBranch = function () {

	    var localctx = new DatatypeBranchContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 22, QLParser.RULE_datatypeBranch);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 213;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if (_la === QLParser.StartQLDoc) {
	            this.state = 212;
	            this.qldoc();
	        }

	        this.state = 218;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while (_la === QLParser.Lowerid) {
	            this.state = 215;
	            this.annotation();
	            this.state = 220;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	        this.state = 221;
	        this.className();
	        this.state = 222;
	        this.match(QLParser.OPAR);
	        this.state = 223;
	        this.varDecls();
	        this.state = 224;
	        this.match(QLParser.CPAR);
	        this.state = 225;
	        this.branchBody();
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function BranchBodyContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_branchBody;
	    return this;
	}

	BranchBodyContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	BranchBodyContext.prototype.constructor = BranchBodyContext;

	BranchBodyContext.prototype.body = function () {
	    return this.getTypedRuleContext(BodyContext, 0);
	};

	BranchBodyContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitBranchBody(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.BranchBodyContext = BranchBodyContext;

	QLParser.prototype.branchBody = function () {

	    var localctx = new BranchBodyContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 24, QLParser.RULE_branchBody);
	    try {
	        this.state = 229;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.EOF:
	            case QLParser.BOOLEAN:
	            case QLParser.CLASS:
	            case QLParser.NEWTYPE:
	            case QLParser.DATE:
	            case QLParser.FLOAT:
	            case QLParser.FROM:
	            case QLParser.IMPORT:
	            case QLParser.INT:
	            case QLParser.MODULE:
	            case QLParser.OR:
	            case QLParser.PREDICATE:
	            case QLParser.SELECT:
	            case QLParser.STRING:
	            case QLParser.WHERE:
	            case QLParser.CBRACE:
	            case QLParser.Lowerid:
	            case QLParser.Upperid:
	            case QLParser.Atlowerid:
	            case QLParser.StartQLDoc:
	                this.enterOuterAlt(localctx, 1);

	                break;
	            case QLParser.OBRACE:
	                this.enterOuterAlt(localctx, 2);
	                this.state = 228;
	                this.body();
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function SelectContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_select;
	    return this;
	}

	SelectContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	SelectContext.prototype.constructor = SelectContext;

	SelectContext.prototype.SELECT = function () {
	    return this.getToken(QLParser.SELECT, 0);
	};

	SelectContext.prototype.asExprs = function () {
	    return this.getTypedRuleContext(AsExprsContext, 0);
	};

	SelectContext.prototype.FROM = function () {
	    return this.getToken(QLParser.FROM, 0);
	};

	SelectContext.prototype.varDecls = function () {
	    return this.getTypedRuleContext(VarDeclsContext, 0);
	};

	SelectContext.prototype.WHERE = function () {
	    return this.getToken(QLParser.WHERE, 0);
	};

	SelectContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};

	SelectContext.prototype.orderBys = function () {
	    return this.getTypedRuleContext(OrderBysContext, 0);
	};

	SelectContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitSelect(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.SelectContext = SelectContext;

	QLParser.prototype.select = function () {

	    var localctx = new SelectContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 26, QLParser.RULE_select);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 233;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if (_la === QLParser.FROM) {
	            this.state = 231;
	            this.match(QLParser.FROM);
	            this.state = 232;
	            this.varDecls();
	        }

	        this.state = 237;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if (_la === QLParser.WHERE) {
	            this.state = 235;
	            this.match(QLParser.WHERE);
	            this.state = 236;
	            this.exprOrTerm(0);
	        }

	        this.state = 239;
	        this.match(QLParser.SELECT);
	        this.state = 240;
	        this.asExprs();
	        this.state = 242;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if (_la === QLParser.ORDER) {
	            this.state = 241;
	            this.orderBys();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function DataclassContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_dataclass;
	    return this;
	}

	DataclassContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	DataclassContext.prototype.constructor = DataclassContext;

	DataclassContext.prototype.CLASS = function () {
	    return this.getToken(QLParser.CLASS, 0);
	};

	DataclassContext.prototype.className = function () {
	    return this.getTypedRuleContext(ClassNameContext, 0);
	};

	DataclassContext.prototype.EXTENDS = function () {
	    return this.getToken(QLParser.EXTENDS, 0);
	};

	DataclassContext.prototype.typeExpr = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(TypeExprContext);
	    } else {
	        return this.getTypedRuleContext(TypeExprContext, i);
	    }
	};

	DataclassContext.prototype.OBRACE = function () {
	    return this.getToken(QLParser.OBRACE, 0);
	};

	DataclassContext.prototype.CBRACE = function () {
	    return this.getToken(QLParser.CBRACE, 0);
	};

	DataclassContext.prototype.typeAliasBody = function () {
	    return this.getTypedRuleContext(TypeAliasBodyContext, 0);
	};

	DataclassContext.prototype.COMMA = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.COMMA);
	    } else {
	        return this.getToken(QLParser.COMMA, i);
	    }
	};

	DataclassContext.prototype.classMember = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ClassMemberContext);
	    } else {
	        return this.getTypedRuleContext(ClassMemberContext, i);
	    }
	};

	DataclassContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitDataclass(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.DataclassContext = DataclassContext;

	QLParser.prototype.dataclass = function () {

	    var localctx = new DataclassContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 28, QLParser.RULE_dataclass);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 244;
	        this.match(QLParser.CLASS);
	        this.state = 245;
	        this.className();
	        this.state = 265;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.EXTENDS:
	                this.state = 246;
	                this.match(QLParser.EXTENDS);
	                this.state = 247;
	                this.typeExpr();
	                this.state = 252;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	                while (_la === QLParser.COMMA) {
	                    this.state = 248;
	                    this.match(QLParser.COMMA);
	                    this.state = 249;
	                    this.typeExpr();
	                    this.state = 254;
	                    this._errHandler.sync(this);
	                    _la = this._input.LA(1);
	                }
	                this.state = 255;
	                this.match(QLParser.OBRACE);
	                this.state = 259;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	                while ((_la & ~0x1f) == 0 && (1 << _la & (1 << QLParser.BOOLEAN | 1 << QLParser.DATE | 1 << QLParser.FLOAT | 1 << QLParser.INT)) !== 0 || _la === QLParser.PREDICATE || _la === QLParser.STRING || (_la - 73 & ~0x1f) == 0 && (1 << _la - 73 & (1 << QLParser.Lowerid - 73 | 1 << QLParser.Upperid - 73 | 1 << QLParser.Atlowerid - 73 | 1 << QLParser.StartQLDoc - 73)) !== 0) {
	                    this.state = 256;
	                    this.classMember();
	                    this.state = 261;
	                    this._errHandler.sync(this);
	                    _la = this._input.LA(1);
	                }
	                this.state = 262;
	                this.match(QLParser.CBRACE);
	                break;
	            case QLParser.EQ:
	                this.state = 264;
	                this.typeAliasBody();
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ClassMemberContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_classMember;
	    return this;
	}

	ClassMemberContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ClassMemberContext.prototype.constructor = ClassMemberContext;

	ClassMemberContext.prototype.charpred = function () {
	    return this.getTypedRuleContext(CharpredContext, 0);
	};

	ClassMemberContext.prototype.memberPredicate = function () {
	    return this.getTypedRuleContext(MemberPredicateContext, 0);
	};

	ClassMemberContext.prototype.field = function () {
	    return this.getTypedRuleContext(FieldContext, 0);
	};

	ClassMemberContext.prototype.annotation = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(AnnotationContext);
	    } else {
	        return this.getTypedRuleContext(AnnotationContext, i);
	    }
	};

	ClassMemberContext.prototype.qldoc = function () {
	    return this.getTypedRuleContext(QldocContext, 0);
	};

	ClassMemberContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitClassMember(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ClassMemberContext = ClassMemberContext;

	QLParser.prototype.classMember = function () {

	    var localctx = new ClassMemberContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 30, QLParser.RULE_classMember);
	    try {
	        this.state = 279;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.BOOLEAN:
	            case QLParser.DATE:
	            case QLParser.FLOAT:
	            case QLParser.INT:
	            case QLParser.PREDICATE:
	            case QLParser.STRING:
	            case QLParser.Lowerid:
	            case QLParser.Upperid:
	            case QLParser.Atlowerid:
	                this.enterOuterAlt(localctx, 1);
	                this.state = 270;
	                this._errHandler.sync(this);
	                var _alt = this._interp.adaptivePredict(this._input, 17, this._ctx);
	                while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	                    if (_alt === 1) {
	                        this.state = 267;
	                        this.annotation();
	                    }
	                    this.state = 272;
	                    this._errHandler.sync(this);
	                    _alt = this._interp.adaptivePredict(this._input, 17, this._ctx);
	                }

	                this.state = 276;
	                this._errHandler.sync(this);
	                var la_ = this._interp.adaptivePredict(this._input, 18, this._ctx);
	                switch (la_) {
	                    case 1:
	                        this.state = 273;
	                        this.charpred();
	                        break;

	                    case 2:
	                        this.state = 274;
	                        this.memberPredicate();
	                        break;

	                    case 3:
	                        this.state = 275;
	                        this.field();
	                        break;

	                }
	                break;
	            case QLParser.StartQLDoc:
	                this.enterOuterAlt(localctx, 2);
	                this.state = 278;
	                this.qldoc();
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function CharpredContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_charpred;
	    return this;
	}

	CharpredContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	CharpredContext.prototype.constructor = CharpredContext;

	CharpredContext.prototype.className = function () {
	    return this.getTypedRuleContext(ClassNameContext, 0);
	};

	CharpredContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	CharpredContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};

	CharpredContext.prototype.OBRACE = function () {
	    return this.getToken(QLParser.OBRACE, 0);
	};

	CharpredContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};

	CharpredContext.prototype.CBRACE = function () {
	    return this.getToken(QLParser.CBRACE, 0);
	};

	CharpredContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitCharpred(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.CharpredContext = CharpredContext;

	QLParser.prototype.charpred = function () {

	    var localctx = new CharpredContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 32, QLParser.RULE_charpred);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 281;
	        this.className();
	        this.state = 282;
	        this.match(QLParser.OPAR);
	        this.state = 283;
	        this.match(QLParser.CPAR);
	        this.state = 284;
	        this.match(QLParser.OBRACE);
	        this.state = 285;
	        this.exprOrTerm(0);
	        this.state = 286;
	        this.match(QLParser.CBRACE);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function MemberPredicateContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_memberPredicate;
	    return this;
	}

	MemberPredicateContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	MemberPredicateContext.prototype.constructor = MemberPredicateContext;

	MemberPredicateContext.prototype.returnType = function () {
	    return this.getTypedRuleContext(ReturnTypeContext, 0);
	};

	MemberPredicateContext.prototype.predicateName = function () {
	    return this.getTypedRuleContext(PredicateNameContext, 0);
	};

	MemberPredicateContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	MemberPredicateContext.prototype.varDecls = function () {
	    return this.getTypedRuleContext(VarDeclsContext, 0);
	};

	MemberPredicateContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};

	MemberPredicateContext.prototype.optbody = function () {
	    return this.getTypedRuleContext(OptbodyContext, 0);
	};

	MemberPredicateContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitMemberPredicate(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.MemberPredicateContext = MemberPredicateContext;

	QLParser.prototype.memberPredicate = function () {

	    var localctx = new MemberPredicateContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 34, QLParser.RULE_memberPredicate);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 288;
	        this.returnType();
	        this.state = 289;
	        this.predicateName();
	        this.state = 290;
	        this.match(QLParser.OPAR);
	        this.state = 291;
	        this.varDecls();
	        this.state = 292;
	        this.match(QLParser.CPAR);
	        this.state = 293;
	        this.optbody();
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function FieldContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_field;
	    return this;
	}

	FieldContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	FieldContext.prototype.constructor = FieldContext;

	FieldContext.prototype.varDecl = function () {
	    return this.getTypedRuleContext(VarDeclContext, 0);
	};

	FieldContext.prototype.SEMI = function () {
	    return this.getToken(QLParser.SEMI, 0);
	};

	FieldContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitField(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.FieldContext = FieldContext;

	QLParser.prototype.field = function () {

	    var localctx = new FieldContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 36, QLParser.RULE_field);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 295;
	        this.varDecl();
	        this.state = 296;
	        this.match(QLParser.SEMI);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function OptbodyContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_optbody;
	    return this;
	}

	OptbodyContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	OptbodyContext.prototype.constructor = OptbodyContext;

	OptbodyContext.prototype.empty = function () {
	    return this.getTypedRuleContext(EmptyContext, 0);
	};

	OptbodyContext.prototype.body = function () {
	    return this.getTypedRuleContext(BodyContext, 0);
	};

	OptbodyContext.prototype.higherOrderTerm = function () {
	    return this.getTypedRuleContext(HigherOrderTermContext, 0);
	};

	OptbodyContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitOptbody(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.OptbodyContext = OptbodyContext;

	QLParser.prototype.optbody = function () {

	    var localctx = new OptbodyContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 38, QLParser.RULE_optbody);
	    try {
	        this.state = 301;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.SEMI:
	                this.enterOuterAlt(localctx, 1);
	                this.state = 298;
	                this.empty();
	                break;
	            case QLParser.OBRACE:
	                this.enterOuterAlt(localctx, 2);
	                this.state = 299;
	                this.body();
	                break;
	            case QLParser.EQ:
	                this.enterOuterAlt(localctx, 3);
	                this.state = 300;
	                this.higherOrderTerm();
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function EmptyContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_empty;
	    return this;
	}

	EmptyContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	EmptyContext.prototype.constructor = EmptyContext;

	EmptyContext.prototype.SEMI = function () {
	    return this.getToken(QLParser.SEMI, 0);
	};

	EmptyContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitEmpty(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.EmptyContext = EmptyContext;

	QLParser.prototype.empty = function () {

	    var localctx = new EmptyContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 40, QLParser.RULE_empty);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 303;
	        this.match(QLParser.SEMI);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function BodyContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_body;
	    return this;
	}

	BodyContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	BodyContext.prototype.constructor = BodyContext;

	BodyContext.prototype.OBRACE = function () {
	    return this.getToken(QLParser.OBRACE, 0);
	};

	BodyContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};

	BodyContext.prototype.CBRACE = function () {
	    return this.getToken(QLParser.CBRACE, 0);
	};

	BodyContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitBody(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.BodyContext = BodyContext;

	QLParser.prototype.body = function () {

	    var localctx = new BodyContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 42, QLParser.RULE_body);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 305;
	        this.match(QLParser.OBRACE);
	        this.state = 306;
	        this.exprOrTerm(0);
	        this.state = 307;
	        this.match(QLParser.CBRACE);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function HigherOrderTermContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_higherOrderTerm;
	    this.name = null; // LiteralIdContext
	    return this;
	}

	HigherOrderTermContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	HigherOrderTermContext.prototype.constructor = HigherOrderTermContext;

	HigherOrderTermContext.prototype.EQ = function () {
	    return this.getToken(QLParser.EQ, 0);
	};

	HigherOrderTermContext.prototype.OPAR = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.OPAR);
	    } else {
	        return this.getToken(QLParser.OPAR, i);
	    }
	};

	HigherOrderTermContext.prototype.CPAR = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.CPAR);
	    } else {
	        return this.getToken(QLParser.CPAR, i);
	    }
	};

	HigherOrderTermContext.prototype.callArgs = function () {
	    return this.getTypedRuleContext(CallArgsContext, 0);
	};

	HigherOrderTermContext.prototype.literalId = function () {
	    return this.getTypedRuleContext(LiteralIdContext, 0);
	};

	HigherOrderTermContext.prototype.predicateExpr = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(PredicateExprContext);
	    } else {
	        return this.getTypedRuleContext(PredicateExprContext, i);
	    }
	};

	HigherOrderTermContext.prototype.COMMA = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.COMMA);
	    } else {
	        return this.getToken(QLParser.COMMA, i);
	    }
	};

	HigherOrderTermContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitHigherOrderTerm(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.HigherOrderTermContext = HigherOrderTermContext;

	QLParser.prototype.higherOrderTerm = function () {

	    var localctx = new HigherOrderTermContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 44, QLParser.RULE_higherOrderTerm);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 309;
	        this.match(QLParser.EQ);
	        this.state = 310;
	        localctx.name = this.literalId();
	        this.state = 311;
	        this.match(QLParser.OPAR);
	        this.state = 320;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if ((_la - 73 & ~0x1f) == 0 && (1 << _la - 73 & (1 << QLParser.Lowerid - 73 | 1 << QLParser.Upperid - 73 | 1 << QLParser.Atlowerid - 73)) !== 0) {
	            this.state = 312;
	            this.predicateExpr();
	            this.state = 317;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	            while (_la === QLParser.COMMA) {
	                this.state = 313;
	                this.match(QLParser.COMMA);
	                this.state = 314;
	                this.predicateExpr();
	                this.state = 319;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	            }
	        }

	        this.state = 322;
	        this.match(QLParser.CPAR);
	        this.state = 323;
	        this.match(QLParser.OPAR);
	        this.state = 324;
	        this.callArgs();
	        this.state = 325;
	        this.match(QLParser.CPAR);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ExprOrTermContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_exprOrTerm;
	    return this;
	}

	ExprOrTermContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ExprOrTermContext.prototype.constructor = ExprOrTermContext;

	ExprOrTermContext.prototype.copyFrom = function (ctx) {
	    antlr4.ParserRuleContext.prototype.copyFrom.call(this, ctx);
	};

	function CastContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	CastContext.prototype = Object.create(ExprOrTermContext.prototype);
	CastContext.prototype.constructor = CastContext;

	QLParser.CastContext = CastContext;

	CastContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	CastContext.prototype.typeExpr = function () {
	    return this.getTypedRuleContext(TypeExprContext, 0);
	};

	CastContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};

	CastContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};
	CastContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitCast(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function InContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    this.target = null; // ExprOrTermContext;
	    this.range = null; // PrimaryContext;
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	InContext.prototype = Object.create(ExprOrTermContext.prototype);
	InContext.prototype.constructor = InContext;

	QLParser.InContext = InContext;

	InContext.prototype.IN = function () {
	    return this.getToken(QLParser.IN, 0);
	};

	InContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};

	InContext.prototype.primary = function () {
	    return this.getTypedRuleContext(PrimaryContext, 0);
	};
	InContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitIn(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function AddOperationContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    this.left = null; // ExprOrTermContext;
	    this.right = null; // ExprOrTermContext;
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	AddOperationContext.prototype = Object.create(ExprOrTermContext.prototype);
	AddOperationContext.prototype.constructor = AddOperationContext;

	QLParser.AddOperationContext = AddOperationContext;

	AddOperationContext.prototype.addop = function () {
	    return this.getTypedRuleContext(AddopContext, 0);
	};

	AddOperationContext.prototype.exprOrTerm = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ExprOrTermContext);
	    } else {
	        return this.getTypedRuleContext(ExprOrTermContext, i);
	    }
	};
	AddOperationContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitAddOperation(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function UnaryContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	UnaryContext.prototype = Object.create(ExprOrTermContext.prototype);
	UnaryContext.prototype.constructor = UnaryContext;

	QLParser.UnaryContext = UnaryContext;

	UnaryContext.prototype.unop = function () {
	    return this.getTypedRuleContext(UnopContext, 0);
	};

	UnaryContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};
	UnaryContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitUnary(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function QuantifiedTermContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	QuantifiedTermContext.prototype = Object.create(ExprOrTermContext.prototype);
	QuantifiedTermContext.prototype.constructor = QuantifiedTermContext;

	QLParser.QuantifiedTermContext = QuantifiedTermContext;

	QuantifiedTermContext.prototype.quantifier = function () {
	    return this.getTypedRuleContext(QuantifierContext, 0);
	};

	QuantifiedTermContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	QuantifiedTermContext.prototype.quantBody = function () {
	    return this.getTypedRuleContext(QuantBodyContext, 0);
	};

	QuantifiedTermContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};
	QuantifiedTermContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitQuantifiedTerm(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function NotContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	NotContext.prototype = Object.create(ExprOrTermContext.prototype);
	NotContext.prototype.constructor = NotContext;

	QLParser.NotContext = NotContext;

	NotContext.prototype.NOT = function () {
	    return this.getToken(QLParser.NOT, 0);
	};

	NotContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};
	NotContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitNot(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function DisjunctionContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	DisjunctionContext.prototype = Object.create(ExprOrTermContext.prototype);
	DisjunctionContext.prototype.constructor = DisjunctionContext;

	QLParser.DisjunctionContext = DisjunctionContext;

	DisjunctionContext.prototype.exprOrTerm = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ExprOrTermContext);
	    } else {
	        return this.getTypedRuleContext(ExprOrTermContext, i);
	    }
	};

	DisjunctionContext.prototype.OR = function () {
	    return this.getToken(QLParser.OR, 0);
	};
	DisjunctionContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitDisjunction(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function ImpliesContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    this.left = null; // ExprOrTermContext;
	    this.right = null; // ExprOrTermContext;
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	ImpliesContext.prototype = Object.create(ExprOrTermContext.prototype);
	ImpliesContext.prototype.constructor = ImpliesContext;

	QLParser.ImpliesContext = ImpliesContext;

	ImpliesContext.prototype.IMPLIES = function () {
	    return this.getToken(QLParser.IMPLIES, 0);
	};

	ImpliesContext.prototype.exprOrTerm = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ExprOrTermContext);
	    } else {
	        return this.getTypedRuleContext(ExprOrTermContext, i);
	    }
	};
	ImpliesContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitImplies(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function ComparisonContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	ComparisonContext.prototype = Object.create(ExprOrTermContext.prototype);
	ComparisonContext.prototype.constructor = ComparisonContext;

	QLParser.ComparisonContext = ComparisonContext;

	ComparisonContext.prototype.exprOrTerm = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ExprOrTermContext);
	    } else {
	        return this.getTypedRuleContext(ExprOrTermContext, i);
	    }
	};

	ComparisonContext.prototype.compop = function () {
	    return this.getTypedRuleContext(CompopContext, 0);
	};
	ComparisonContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitComparison(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function SpecialCallContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	SpecialCallContext.prototype = Object.create(ExprOrTermContext.prototype);
	SpecialCallContext.prototype.constructor = SpecialCallContext;

	QLParser.SpecialCallContext = SpecialCallContext;

	SpecialCallContext.prototype.specialId = function () {
	    return this.getTypedRuleContext(SpecialIdContext, 0);
	};

	SpecialCallContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	SpecialCallContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};
	SpecialCallContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitSpecialCall(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function ConjunctionContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	ConjunctionContext.prototype = Object.create(ExprOrTermContext.prototype);
	ConjunctionContext.prototype.constructor = ConjunctionContext;

	QLParser.ConjunctionContext = ConjunctionContext;

	ConjunctionContext.prototype.exprOrTerm = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ExprOrTermContext);
	    } else {
	        return this.getTypedRuleContext(ExprOrTermContext, i);
	    }
	};

	ConjunctionContext.prototype.AND = function () {
	    return this.getToken(QLParser.AND, 0);
	};
	ConjunctionContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitConjunction(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function InstanceofContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	InstanceofContext.prototype = Object.create(ExprOrTermContext.prototype);
	InstanceofContext.prototype.constructor = InstanceofContext;

	QLParser.InstanceofContext = InstanceofContext;

	InstanceofContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};

	InstanceofContext.prototype.INSTANCEOF = function () {
	    return this.getToken(QLParser.INSTANCEOF, 0);
	};

	InstanceofContext.prototype.typeExpr = function () {
	    return this.getTypedRuleContext(TypeExprContext, 0);
	};
	InstanceofContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitInstanceof(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function PrimaryTermContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	PrimaryTermContext.prototype = Object.create(ExprOrTermContext.prototype);
	PrimaryTermContext.prototype.constructor = PrimaryTermContext;

	QLParser.PrimaryTermContext = PrimaryTermContext;

	PrimaryTermContext.prototype.primary = function () {
	    return this.getTypedRuleContext(PrimaryContext, 0);
	};
	PrimaryTermContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitPrimaryTerm(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function IfContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    this.cond = null; // ExprOrTermContext;
	    this.first = null; // ExprOrTermContext;
	    this.second = null; // ExprOrTermContext;
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	IfContext.prototype = Object.create(ExprOrTermContext.prototype);
	IfContext.prototype.constructor = IfContext;

	QLParser.IfContext = IfContext;

	IfContext.prototype.IF = function () {
	    return this.getToken(QLParser.IF, 0);
	};

	IfContext.prototype.THEN = function () {
	    return this.getToken(QLParser.THEN, 0);
	};

	IfContext.prototype.ELSE = function () {
	    return this.getToken(QLParser.ELSE, 0);
	};

	IfContext.prototype.exprOrTerm = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ExprOrTermContext);
	    } else {
	        return this.getTypedRuleContext(ExprOrTermContext, i);
	    }
	};
	IfContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitIf(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function MulOperationContext(parser, ctx) {
	    ExprOrTermContext.call(this, parser);
	    this.left = null; // ExprOrTermContext;
	    this.right = null; // ExprOrTermContext;
	    ExprOrTermContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	MulOperationContext.prototype = Object.create(ExprOrTermContext.prototype);
	MulOperationContext.prototype.constructor = MulOperationContext;

	QLParser.MulOperationContext = MulOperationContext;

	MulOperationContext.prototype.mulop = function () {
	    return this.getTypedRuleContext(MulopContext, 0);
	};

	MulOperationContext.prototype.exprOrTerm = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ExprOrTermContext);
	    } else {
	        return this.getTypedRuleContext(ExprOrTermContext, i);
	    }
	};
	MulOperationContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitMulOperation(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.prototype.exprOrTerm = function (_p) {
	    if (_p === undefined) {
	        _p = 0;
	    }
	    var _parentctx = this._ctx;
	    var _parentState = this.state;
	    var localctx = new ExprOrTermContext(this, this._ctx, _parentState);
	    var _prevctx = localctx;
	    var _startState = 46;
	    this.enterRecursionRule(localctx, 46, QLParser.RULE_exprOrTerm, _p);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 355;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input, 23, this._ctx);
	        switch (la_) {
	            case 1:
	                localctx = new SpecialCallContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;

	                this.state = 328;
	                this.specialId();
	                this.state = 329;
	                this.match(QLParser.OPAR);
	                this.state = 330;
	                this.match(QLParser.CPAR);
	                break;

	            case 2:
	                localctx = new CastContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 332;
	                this.match(QLParser.OPAR);
	                this.state = 333;
	                this.typeExpr();
	                this.state = 334;
	                this.match(QLParser.CPAR);
	                this.state = 335;
	                this.exprOrTerm(14);
	                break;

	            case 3:
	                localctx = new PrimaryTermContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 337;
	                this.primary(0);
	                break;

	            case 4:
	                localctx = new UnaryContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 338;
	                this.unop();
	                this.state = 339;
	                this.exprOrTerm(12);
	                break;

	            case 5:
	                localctx = new NotContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 341;
	                this.match(QLParser.NOT);
	                this.state = 342;
	                this.exprOrTerm(6);
	                break;

	            case 6:
	                localctx = new IfContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 343;
	                this.match(QLParser.IF);
	                this.state = 344;
	                localctx.cond = this.exprOrTerm(0);
	                this.state = 345;
	                this.match(QLParser.THEN);
	                this.state = 346;
	                localctx.first = this.exprOrTerm(0);
	                this.state = 347;
	                this.match(QLParser.ELSE);
	                this.state = 348;
	                localctx.second = this.exprOrTerm(5);
	                break;

	            case 7:
	                localctx = new QuantifiedTermContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 350;
	                this.quantifier();
	                this.state = 351;
	                this.match(QLParser.OPAR);
	                this.state = 352;
	                this.quantBody();
	                this.state = 353;
	                this.match(QLParser.CPAR);
	                break;

	        }
	        this._ctx.stop = this._input.LT(-1);
	        this.state = 386;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input, 25, this._ctx);
	        while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if (_alt === 1) {
	                if (this._parseListeners !== null) {
	                    this.triggerExitRuleEvent();
	                }
	                _prevctx = localctx;
	                this.state = 384;
	                this._errHandler.sync(this);
	                var la_ = this._interp.adaptivePredict(this._input, 24, this._ctx);
	                switch (la_) {
	                    case 1:
	                        localctx = new MulOperationContext(this, new ExprOrTermContext(this, _parentctx, _parentState));
	                        localctx.left = _prevctx;
	                        this.pushNewRecursionContext(localctx, _startState, QLParser.RULE_exprOrTerm);
	                        this.state = 357;
	                        if (!this.precpred(this._ctx, 11)) {
	                            throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 11)");
	                        }
	                        this.state = 358;
	                        this.mulop();
	                        this.state = 359;
	                        localctx.right = this.exprOrTerm(12);
	                        break;

	                    case 2:
	                        localctx = new AddOperationContext(this, new ExprOrTermContext(this, _parentctx, _parentState));
	                        localctx.left = _prevctx;
	                        this.pushNewRecursionContext(localctx, _startState, QLParser.RULE_exprOrTerm);
	                        this.state = 361;
	                        if (!this.precpred(this._ctx, 10)) {
	                            throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 10)");
	                        }
	                        this.state = 362;
	                        this.addop();
	                        this.state = 363;
	                        localctx.right = this.exprOrTerm(11);
	                        break;

	                    case 3:
	                        localctx = new ComparisonContext(this, new ExprOrTermContext(this, _parentctx, _parentState));
	                        this.pushNewRecursionContext(localctx, _startState, QLParser.RULE_exprOrTerm);
	                        this.state = 365;
	                        if (!this.precpred(this._ctx, 8)) {
	                            throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 8)");
	                        }
	                        this.state = 366;
	                        this.compop();
	                        this.state = 367;
	                        this.exprOrTerm(9);
	                        break;

	                    case 4:
	                        localctx = new ConjunctionContext(this, new ExprOrTermContext(this, _parentctx, _parentState));
	                        this.pushNewRecursionContext(localctx, _startState, QLParser.RULE_exprOrTerm);
	                        this.state = 369;
	                        if (!this.precpred(this._ctx, 4)) {
	                            throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 4)");
	                        }
	                        this.state = 370;
	                        this.match(QLParser.AND);
	                        this.state = 371;
	                        this.exprOrTerm(5);
	                        break;

	                    case 5:
	                        localctx = new DisjunctionContext(this, new ExprOrTermContext(this, _parentctx, _parentState));
	                        this.pushNewRecursionContext(localctx, _startState, QLParser.RULE_exprOrTerm);
	                        this.state = 372;
	                        if (!this.precpred(this._ctx, 3)) {
	                            throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 3)");
	                        }
	                        this.state = 373;
	                        this.match(QLParser.OR);
	                        this.state = 374;
	                        this.exprOrTerm(4);
	                        break;

	                    case 6:
	                        localctx = new ImpliesContext(this, new ExprOrTermContext(this, _parentctx, _parentState));
	                        localctx.left = _prevctx;
	                        this.pushNewRecursionContext(localctx, _startState, QLParser.RULE_exprOrTerm);
	                        this.state = 375;
	                        if (!this.precpred(this._ctx, 2)) {
	                            throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 2)");
	                        }
	                        this.state = 376;
	                        this.match(QLParser.IMPLIES);
	                        this.state = 377;
	                        localctx.right = this.exprOrTerm(2);
	                        break;

	                    case 7:
	                        localctx = new InContext(this, new ExprOrTermContext(this, _parentctx, _parentState));
	                        localctx.target = _prevctx;
	                        this.pushNewRecursionContext(localctx, _startState, QLParser.RULE_exprOrTerm);
	                        this.state = 378;
	                        if (!this.precpred(this._ctx, 9)) {
	                            throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 9)");
	                        }
	                        this.state = 379;
	                        this.match(QLParser.IN);
	                        this.state = 380;
	                        localctx.range = this.primary(0);
	                        break;

	                    case 8:
	                        localctx = new InstanceofContext(this, new ExprOrTermContext(this, _parentctx, _parentState));
	                        this.pushNewRecursionContext(localctx, _startState, QLParser.RULE_exprOrTerm);
	                        this.state = 381;
	                        if (!this.precpred(this._ctx, 7)) {
	                            throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 7)");
	                        }
	                        this.state = 382;
	                        this.match(QLParser.INSTANCEOF);
	                        this.state = 383;
	                        this.typeExpr();
	                        break;

	                }
	            }
	            this.state = 388;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input, 25, this._ctx);
	        }
	    } catch (error) {
	        if (error instanceof antlr4.error.RecognitionException) {
	            localctx.exception = error;
	            this._errHandler.reportError(this, error);
	            this._errHandler.recover(this, error);
	        } else {
	            throw error;
	        }
	    } finally {
	        this.unrollRecursionContexts(_parentctx);
	    }
	    return localctx;
	};

	function SpecialIdContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_specialId;
	    return this;
	}

	SpecialIdContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	SpecialIdContext.prototype.constructor = SpecialIdContext;

	SpecialIdContext.prototype.ANY = function () {
	    return this.getToken(QLParser.ANY, 0);
	};

	SpecialIdContext.prototype.NONE = function () {
	    return this.getToken(QLParser.NONE, 0);
	};

	SpecialIdContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitSpecialId(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.SpecialIdContext = SpecialIdContext;

	QLParser.prototype.specialId = function () {

	    var localctx = new SpecialIdContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 48, QLParser.RULE_specialId);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 389;
	        _la = this._input.LA(1);
	        if (!(_la === QLParser.ANY || _la === QLParser.NONE)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function QuantBodyContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_quantBody;
	    return this;
	}

	QuantBodyContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	QuantBodyContext.prototype.constructor = QuantBodyContext;

	QuantBodyContext.prototype.varDecls = function () {
	    return this.getTypedRuleContext(VarDeclsContext, 0);
	};

	QuantBodyContext.prototype.BAR = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.BAR);
	    } else {
	        return this.getToken(QLParser.BAR, i);
	    }
	};

	QuantBodyContext.prototype.exprOrTerm = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ExprOrTermContext);
	    } else {
	        return this.getTypedRuleContext(ExprOrTermContext, i);
	    }
	};

	QuantBodyContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitQuantBody(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.QuantBodyContext = QuantBodyContext;

	QLParser.prototype.quantBody = function () {

	    var localctx = new QuantBodyContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 50, QLParser.RULE_quantBody);
	    var _la = 0; // Token type
	    try {
	        this.state = 401;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input, 28, this._ctx);
	        switch (la_) {
	            case 1:
	                this.enterOuterAlt(localctx, 1);
	                this.state = 391;
	                this.varDecls();
	                this.state = 398;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	                if (_la === QLParser.BAR) {
	                    this.state = 392;
	                    this.match(QLParser.BAR);
	                    this.state = 393;
	                    this.exprOrTerm(0);
	                    this.state = 396;
	                    this._errHandler.sync(this);
	                    _la = this._input.LA(1);
	                    if (_la === QLParser.BAR) {
	                        this.state = 394;
	                        this.match(QLParser.BAR);
	                        this.state = 395;
	                        this.exprOrTerm(0);
	                    }
	                }

	                break;

	            case 2:
	                this.enterOuterAlt(localctx, 2);
	                this.state = 400;
	                this.exprOrTerm(0);
	                break;

	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function QuantifierContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_quantifier;
	    return this;
	}

	QuantifierContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	QuantifierContext.prototype.constructor = QuantifierContext;

	QuantifierContext.prototype.EXISTS = function () {
	    return this.getToken(QLParser.EXISTS, 0);
	};

	QuantifierContext.prototype.FORALL = function () {
	    return this.getToken(QLParser.FORALL, 0);
	};

	QuantifierContext.prototype.FOREX = function () {
	    return this.getToken(QLParser.FOREX, 0);
	};

	QuantifierContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitQuantifier(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.QuantifierContext = QuantifierContext;

	QLParser.prototype.quantifier = function () {

	    var localctx = new QuantifierContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 52, QLParser.RULE_quantifier);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 403;
	        _la = this._input.LA(1);
	        if (!((_la & ~0x1f) == 0 && (1 << _la & (1 << QLParser.EXISTS | 1 << QLParser.FORALL | 1 << QLParser.FOREX)) !== 0)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function CallArgContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_callArg;
	    return this;
	}

	CallArgContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	CallArgContext.prototype.constructor = CallArgContext;

	CallArgContext.prototype.copyFrom = function (ctx) {
	    antlr4.ParserRuleContext.prototype.copyFrom.call(this, ctx);
	};

	function ExprArgContext(parser, ctx) {
	    CallArgContext.call(this, parser);
	    CallArgContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	ExprArgContext.prototype = Object.create(CallArgContext.prototype);
	ExprArgContext.prototype.constructor = ExprArgContext;

	QLParser.ExprArgContext = ExprArgContext;

	ExprArgContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};
	ExprArgContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitExprArg(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function DontCareContext(parser, ctx) {
	    CallArgContext.call(this, parser);
	    CallArgContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	DontCareContext.prototype = Object.create(CallArgContext.prototype);
	DontCareContext.prototype.constructor = DontCareContext;

	QLParser.DontCareContext = DontCareContext;

	DontCareContext.prototype.UNDERSCORE = function () {
	    return this.getToken(QLParser.UNDERSCORE, 0);
	};
	DontCareContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitDontCare(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.CallArgContext = CallArgContext;

	QLParser.prototype.callArg = function () {

	    var localctx = new CallArgContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 54, QLParser.RULE_callArg);
	    try {
	        this.state = 407;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.ANY:
	            case QLParser.AVG:
	            case QLParser.BOOLEAN:
	            case QLParser.COUNT:
	            case QLParser.DATE:
	            case QLParser.EXISTS:
	            case QLParser.FALSE:
	            case QLParser.FLOAT:
	            case QLParser.FORALL:
	            case QLParser.FOREX:
	            case QLParser.IF:
	            case QLParser.INT:
	            case QLParser.MAX:
	            case QLParser.MIN:
	            case QLParser.NOT:
	            case QLParser.NONE:
	            case QLParser.RANK:
	            case QLParser.RESULT:
	            case QLParser.STRICTCOUNT:
	            case QLParser.STRICTSUM:
	            case QLParser.STRICTCONCAT:
	            case QLParser.CONCAT:
	            case QLParser.STRING:
	            case QLParser.SUM:
	            case QLParser.SUPER:
	            case QLParser.THIS:
	            case QLParser.TRUE:
	            case QLParser.MINUS:
	            case QLParser.OPAR:
	            case QLParser.OBLOCK:
	            case QLParser.PLUS:
	            case QLParser.Lowerid:
	            case QLParser.Upperid:
	            case QLParser.Atlowerid:
	            case QLParser.Integer:
	            case QLParser.Float:
	            case QLParser.String:
	                localctx = new ExprArgContext(this, localctx);
	                this.enterOuterAlt(localctx, 1);
	                this.state = 405;
	                this.exprOrTerm(0);
	                break;
	            case QLParser.UNDERSCORE:
	                localctx = new DontCareContext(this, localctx);
	                this.enterOuterAlt(localctx, 2);
	                this.state = 406;
	                this.match(QLParser.UNDERSCORE);
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function CallArgsContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_callArgs;
	    return this;
	}

	CallArgsContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	CallArgsContext.prototype.constructor = CallArgsContext;

	CallArgsContext.prototype.callArg = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(CallArgContext);
	    } else {
	        return this.getTypedRuleContext(CallArgContext, i);
	    }
	};

	CallArgsContext.prototype.COMMA = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.COMMA);
	    } else {
	        return this.getToken(QLParser.COMMA, i);
	    }
	};

	CallArgsContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitCallArgs(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.CallArgsContext = CallArgsContext;

	QLParser.prototype.callArgs = function () {

	    var localctx = new CallArgsContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 56, QLParser.RULE_callArgs);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 417;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if ((_la & ~0x1f) == 0 && (1 << _la & (1 << QLParser.ANY | 1 << QLParser.AVG | 1 << QLParser.BOOLEAN | 1 << QLParser.COUNT | 1 << QLParser.DATE | 1 << QLParser.EXISTS | 1 << QLParser.FALSE | 1 << QLParser.FLOAT | 1 << QLParser.FORALL | 1 << QLParser.FOREX | 1 << QLParser.IF | 1 << QLParser.INT | 1 << QLParser.MAX | 1 << QLParser.MIN | 1 << QLParser.NOT | 1 << QLParser.NONE)) !== 0 || (_la - 35 & ~0x1f) == 0 && (1 << _la - 35 & (1 << QLParser.RANK - 35 | 1 << QLParser.RESULT - 35 | 1 << QLParser.STRICTCOUNT - 35 | 1 << QLParser.STRICTSUM - 35 | 1 << QLParser.STRICTCONCAT - 35 | 1 << QLParser.CONCAT - 35 | 1 << QLParser.STRING - 35 | 1 << QLParser.SUM - 35 | 1 << QLParser.SUPER - 35 | 1 << QLParser.THIS - 35 | 1 << QLParser.TRUE - 35 | 1 << QLParser.UNDERSCORE - 35 | 1 << QLParser.MINUS - 35 | 1 << QLParser.OPAR - 35 | 1 << QLParser.OBLOCK - 35)) !== 0 || (_la - 70 & ~0x1f) == 0 && (1 << _la - 70 & (1 << QLParser.PLUS - 70 | 1 << QLParser.Lowerid - 70 | 1 << QLParser.Upperid - 70 | 1 << QLParser.Atlowerid - 70 | 1 << QLParser.Integer - 70 | 1 << QLParser.Float - 70 | 1 << QLParser.String - 70)) !== 0) {
	            this.state = 409;
	            this.callArg();
	            this.state = 414;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	            while (_la === QLParser.COMMA) {
	                this.state = 410;
	                this.match(QLParser.COMMA);
	                this.state = 411;
	                this.callArg();
	                this.state = 416;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	            }
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function QualifiedRhsContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_qualifiedRhs;
	    return this;
	}

	QualifiedRhsContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	QualifiedRhsContext.prototype.constructor = QualifiedRhsContext;

	QualifiedRhsContext.prototype.copyFrom = function (ctx) {
	    antlr4.ParserRuleContext.prototype.copyFrom.call(this, ctx);
	};

	function QualCallContext(parser, ctx) {
	    QualifiedRhsContext.call(this, parser);
	    QualifiedRhsContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	QualCallContext.prototype = Object.create(QualifiedRhsContext.prototype);
	QualCallContext.prototype.constructor = QualCallContext;

	QLParser.QualCallContext = QualCallContext;

	QualCallContext.prototype.predicateName = function () {
	    return this.getTypedRuleContext(PredicateNameContext, 0);
	};

	QualCallContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	QualCallContext.prototype.callArgs = function () {
	    return this.getTypedRuleContext(CallArgsContext, 0);
	};

	QualCallContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};

	QualCallContext.prototype.closure = function () {
	    return this.getTypedRuleContext(ClosureContext, 0);
	};
	QualCallContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitQualCall(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function QualCastContext(parser, ctx) {
	    QualifiedRhsContext.call(this, parser);
	    QualifiedRhsContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	QualCastContext.prototype = Object.create(QualifiedRhsContext.prototype);
	QualCastContext.prototype.constructor = QualCastContext;

	QLParser.QualCastContext = QualCastContext;

	QualCastContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	QualCastContext.prototype.typeExpr = function () {
	    return this.getTypedRuleContext(TypeExprContext, 0);
	};

	QualCastContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};
	QualCastContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitQualCast(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.QualifiedRhsContext = QualifiedRhsContext;

	QLParser.prototype.qualifiedRhs = function () {

	    var localctx = new QualifiedRhsContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 58, QLParser.RULE_qualifiedRhs);
	    var _la = 0; // Token type
	    try {
	        this.state = 431;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.Lowerid:
	                localctx = new QualCallContext(this, localctx);
	                this.enterOuterAlt(localctx, 1);
	                this.state = 419;
	                this.predicateName();
	                this.state = 421;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	                if (_la === QLParser.STAR || _la === QLParser.PLUS) {
	                    this.state = 420;
	                    this.closure();
	                }

	                this.state = 423;
	                this.match(QLParser.OPAR);
	                this.state = 424;
	                this.callArgs();
	                this.state = 425;
	                this.match(QLParser.CPAR);
	                break;
	            case QLParser.OPAR:
	                localctx = new QualCastContext(this, localctx);
	                this.enterOuterAlt(localctx, 2);
	                this.state = 427;
	                this.match(QLParser.OPAR);
	                this.state = 428;
	                this.typeExpr();
	                this.state = 429;
	                this.match(QLParser.CPAR);
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function PrimaryContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_primary;
	    return this;
	}

	PrimaryContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	PrimaryContext.prototype.constructor = PrimaryContext;

	PrimaryContext.prototype.copyFrom = function (ctx) {
	    antlr4.ParserRuleContext.prototype.copyFrom.call(this, ctx);
	};

	function AggContext(parser, ctx) {
	    PrimaryContext.call(this, parser);
	    PrimaryContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	AggContext.prototype = Object.create(PrimaryContext.prototype);
	AggContext.prototype.constructor = AggContext;

	QLParser.AggContext = AggContext;

	AggContext.prototype.aggId = function () {
	    return this.getTypedRuleContext(AggIdContext, 0);
	};

	AggContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	AggContext.prototype.aggBody = function () {
	    return this.getTypedRuleContext(AggBodyContext, 0);
	};

	AggContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};

	AggContext.prototype.OBLOCK = function () {
	    return this.getToken(QLParser.OBLOCK, 0);
	};

	AggContext.prototype.exprOrTerm = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ExprOrTermContext);
	    } else {
	        return this.getTypedRuleContext(ExprOrTermContext, i);
	    }
	};

	AggContext.prototype.CBLOCK = function () {
	    return this.getToken(QLParser.CBLOCK, 0);
	};

	AggContext.prototype.COMMA = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.COMMA);
	    } else {
	        return this.getToken(QLParser.COMMA, i);
	    }
	};

	AggContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitAgg(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function SuperContext(parser, ctx) {
	    PrimaryContext.call(this, parser);
	    PrimaryContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	SuperContext.prototype = Object.create(PrimaryContext.prototype);
	SuperContext.prototype.constructor = SuperContext;

	QLParser.SuperContext = SuperContext;

	SuperContext.prototype.SUPER = function () {
	    return this.getToken(QLParser.SUPER, 0);
	};

	SuperContext.prototype.typeExpr = function () {
	    return this.getTypedRuleContext(TypeExprContext, 0);
	};

	SuperContext.prototype.DOT = function () {
	    return this.getToken(QLParser.DOT, 0);
	};
	SuperContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitSuper(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function LitContext(parser, ctx) {
	    PrimaryContext.call(this, parser);
	    PrimaryContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	LitContext.prototype = Object.create(PrimaryContext.prototype);
	LitContext.prototype.constructor = LitContext;

	QLParser.LitContext = LitContext;

	LitContext.prototype.literal = function () {
	    return this.getTypedRuleContext(LiteralContext, 0);
	};
	LitContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitLit(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function VarContext(parser, ctx) {
	    PrimaryContext.call(this, parser);
	    PrimaryContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	VarContext.prototype = Object.create(PrimaryContext.prototype);
	VarContext.prototype.constructor = VarContext;

	QLParser.VarContext = VarContext;

	VarContext.prototype.variable = function () {
	    return this.getTypedRuleContext(VariableContext, 0);
	};
	VarContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitVar(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function ParExprContext(parser, ctx) {
	    PrimaryContext.call(this, parser);
	    PrimaryContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	ParExprContext.prototype = Object.create(PrimaryContext.prototype);
	ParExprContext.prototype.constructor = ParExprContext;

	QLParser.ParExprContext = ParExprContext;

	ParExprContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	ParExprContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};

	ParExprContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};
	ParExprContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitParExpr(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function PredicateAtomExprContext(parser, ctx) {
	    PrimaryContext.call(this, parser);
	    PrimaryContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	PredicateAtomExprContext.prototype = Object.create(PrimaryContext.prototype);
	PredicateAtomExprContext.prototype.constructor = PredicateAtomExprContext;

	QLParser.PredicateAtomExprContext = PredicateAtomExprContext;

	PredicateAtomExprContext.prototype.aritylessPredicateExpr = function () {
	    return this.getTypedRuleContext(AritylessPredicateExprContext, 0);
	};

	PredicateAtomExprContext.prototype.OPAR = function () {
	    return this.getToken(QLParser.OPAR, 0);
	};

	PredicateAtomExprContext.prototype.callArgs = function () {
	    return this.getTypedRuleContext(CallArgsContext, 0);
	};

	PredicateAtomExprContext.prototype.CPAR = function () {
	    return this.getToken(QLParser.CPAR, 0);
	};

	PredicateAtomExprContext.prototype.closure = function () {
	    return this.getTypedRuleContext(ClosureContext, 0);
	};
	PredicateAtomExprContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitPredicateAtomExpr(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function RangeContext(parser, ctx) {
	    PrimaryContext.call(this, parser);
	    this.lower = null; // ExprOrTermContext;
	    this.upper = null; // ExprOrTermContext;
	    PrimaryContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	RangeContext.prototype = Object.create(PrimaryContext.prototype);
	RangeContext.prototype.constructor = RangeContext;

	QLParser.RangeContext = RangeContext;

	RangeContext.prototype.OBLOCK = function () {
	    return this.getToken(QLParser.OBLOCK, 0);
	};

	RangeContext.prototype.RANGE = function () {
	    return this.getToken(QLParser.RANGE, 0);
	};

	RangeContext.prototype.CBLOCK = function () {
	    return this.getToken(QLParser.CBLOCK, 0);
	};

	RangeContext.prototype.exprOrTerm = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(ExprOrTermContext);
	    } else {
	        return this.getTypedRuleContext(ExprOrTermContext, i);
	    }
	};
	RangeContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitRange(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function QualifiedExprContext(parser, ctx) {
	    PrimaryContext.call(this, parser);
	    PrimaryContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	QualifiedExprContext.prototype = Object.create(PrimaryContext.prototype);
	QualifiedExprContext.prototype.constructor = QualifiedExprContext;

	QLParser.QualifiedExprContext = QualifiedExprContext;

	QualifiedExprContext.prototype.primary = function () {
	    return this.getTypedRuleContext(PrimaryContext, 0);
	};

	QualifiedExprContext.prototype.DOT = function () {
	    return this.getToken(QLParser.DOT, 0);
	};

	QualifiedExprContext.prototype.qualifiedRhs = function () {
	    return this.getTypedRuleContext(QualifiedRhsContext, 0);
	};
	QualifiedExprContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitQualifiedExpr(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.prototype.primary = function (_p) {
	    if (_p === undefined) {
	        _p = 0;
	    }
	    var _parentctx = this._ctx;
	    var _parentState = this.state;
	    var localctx = new PrimaryContext(this, this._ctx, _parentState);
	    var _prevctx = localctx;
	    var _startState = 60;
	    this.enterRecursionRule(localctx, 60, QLParser.RULE_primary, _p);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 478;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input, 38, this._ctx);
	        switch (la_) {
	            case 1:
	                localctx = new PredicateAtomExprContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;

	                this.state = 434;
	                this.aritylessPredicateExpr();
	                this.state = 436;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	                if (_la === QLParser.STAR || _la === QLParser.PLUS) {
	                    this.state = 435;
	                    this.closure();
	                }

	                this.state = 438;
	                this.match(QLParser.OPAR);
	                this.state = 439;
	                this.callArgs();
	                this.state = 440;
	                this.match(QLParser.CPAR);
	                break;

	            case 2:
	                localctx = new LitContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 442;
	                this.literal();
	                break;

	            case 3:
	                localctx = new VarContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 443;
	                this.variable();
	                break;

	            case 4:
	                localctx = new SuperContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 447;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	                if ((_la & ~0x1f) == 0 && (1 << _la & (1 << QLParser.BOOLEAN | 1 << QLParser.DATE | 1 << QLParser.FLOAT | 1 << QLParser.INT)) !== 0 || _la === QLParser.STRING || _la === QLParser.Lowerid || _la === QLParser.Upperid || _la === QLParser.Atlowerid) {
	                    this.state = 444;
	                    this.typeExpr();
	                    this.state = 445;
	                    this.match(QLParser.DOT);
	                }

	                this.state = 449;
	                this.match(QLParser.SUPER);
	                break;

	            case 5:
	                localctx = new AggContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 450;
	                this.aggId();
	                this.state = 462;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	                if (_la === QLParser.OBLOCK) {
	                    this.state = 451;
	                    this.match(QLParser.OBLOCK);
	                    this.state = 452;
	                    this.exprOrTerm(0);
	                    this.state = 457;
	                    this._errHandler.sync(this);
	                    _la = this._input.LA(1);
	                    while (_la === QLParser.COMMA) {
	                        this.state = 453;
	                        this.match(QLParser.COMMA);
	                        this.state = 454;
	                        this.exprOrTerm(0);
	                        this.state = 459;
	                        this._errHandler.sync(this);
	                        _la = this._input.LA(1);
	                    }
	                    this.state = 460;
	                    this.match(QLParser.CBLOCK);
	                }

	                this.state = 464;
	                this.match(QLParser.OPAR);
	                this.state = 465;
	                this.aggBody();
	                this.state = 466;
	                this.match(QLParser.CPAR);
	                break;

	            case 6:
	                localctx = new RangeContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 468;
	                this.match(QLParser.OBLOCK);
	                this.state = 469;
	                localctx.lower = this.exprOrTerm(0);
	                this.state = 470;
	                this.match(QLParser.RANGE);
	                this.state = 471;
	                localctx.upper = this.exprOrTerm(0);
	                this.state = 472;
	                this.match(QLParser.CBLOCK);
	                break;

	            case 7:
	                localctx = new ParExprContext(this, localctx);
	                this._ctx = localctx;
	                _prevctx = localctx;
	                this.state = 474;
	                this.match(QLParser.OPAR);
	                this.state = 475;
	                this.exprOrTerm(0);
	                this.state = 476;
	                this.match(QLParser.CPAR);
	                break;

	        }
	        this._ctx.stop = this._input.LT(-1);
	        this.state = 485;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input, 39, this._ctx);
	        while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if (_alt === 1) {
	                if (this._parseListeners !== null) {
	                    this.triggerExitRuleEvent();
	                }
	                _prevctx = localctx;
	                localctx = new QualifiedExprContext(this, new PrimaryContext(this, _parentctx, _parentState));
	                this.pushNewRecursionContext(localctx, _startState, QLParser.RULE_primary);
	                this.state = 480;
	                if (!this.precpred(this._ctx, 7)) {
	                    throw new antlr4.error.FailedPredicateException(this, "this.precpred(this._ctx, 7)");
	                }
	                this.state = 481;
	                this.match(QLParser.DOT);
	                this.state = 482;
	                this.qualifiedRhs();
	            }
	            this.state = 487;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input, 39, this._ctx);
	        }
	    } catch (error) {
	        if (error instanceof antlr4.error.RecognitionException) {
	            localctx.exception = error;
	            this._errHandler.reportError(this, error);
	            this._errHandler.recover(this, error);
	        } else {
	            throw error;
	        }
	    } finally {
	        this.unrollRecursionContexts(_parentctx);
	    }
	    return localctx;
	};

	function AggBodyContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_aggBody;
	    return this;
	}

	AggBodyContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	AggBodyContext.prototype.constructor = AggBodyContext;

	AggBodyContext.prototype.copyFrom = function (ctx) {
	    antlr4.ParserRuleContext.prototype.copyFrom.call(this, ctx);
	};

	function ExprAggBodyContext(parser, ctx) {
	    AggBodyContext.call(this, parser);
	    AggBodyContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	ExprAggBodyContext.prototype = Object.create(AggBodyContext.prototype);
	ExprAggBodyContext.prototype.constructor = ExprAggBodyContext;

	QLParser.ExprAggBodyContext = ExprAggBodyContext;

	ExprAggBodyContext.prototype.asExprs = function () {
	    return this.getTypedRuleContext(AsExprsContext, 0);
	};

	ExprAggBodyContext.prototype.orderBys = function () {
	    return this.getTypedRuleContext(OrderBysContext, 0);
	};
	ExprAggBodyContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitExprAggBody(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function FullAggBodyContext(parser, ctx) {
	    AggBodyContext.call(this, parser);
	    AggBodyContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	FullAggBodyContext.prototype = Object.create(AggBodyContext.prototype);
	FullAggBodyContext.prototype.constructor = FullAggBodyContext;

	QLParser.FullAggBodyContext = FullAggBodyContext;

	FullAggBodyContext.prototype.varDecls = function () {
	    return this.getTypedRuleContext(VarDeclsContext, 0);
	};

	FullAggBodyContext.prototype.BAR = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.BAR);
	    } else {
	        return this.getToken(QLParser.BAR, i);
	    }
	};

	FullAggBodyContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};

	FullAggBodyContext.prototype.asExprs = function () {
	    return this.getTypedRuleContext(AsExprsContext, 0);
	};

	FullAggBodyContext.prototype.orderBys = function () {
	    return this.getTypedRuleContext(OrderBysContext, 0);
	};
	FullAggBodyContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitFullAggBody(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.AggBodyContext = AggBodyContext;

	QLParser.prototype.aggBody = function () {

	    var localctx = new AggBodyContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 62, QLParser.RULE_aggBody);
	    var _la = 0; // Token type
	    try {
	        this.state = 506;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input, 45, this._ctx);
	        switch (la_) {
	            case 1:
	                localctx = new FullAggBodyContext(this, localctx);
	                this.enterOuterAlt(localctx, 1);
	                this.state = 488;
	                this.varDecls();
	                this.state = 500;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	                if (_la === QLParser.BAR) {
	                    this.state = 489;
	                    this.match(QLParser.BAR);
	                    this.state = 491;
	                    this._errHandler.sync(this);
	                    _la = this._input.LA(1);
	                    if ((_la & ~0x1f) == 0 && (1 << _la & (1 << QLParser.ANY | 1 << QLParser.AVG | 1 << QLParser.BOOLEAN | 1 << QLParser.COUNT | 1 << QLParser.DATE | 1 << QLParser.EXISTS | 1 << QLParser.FALSE | 1 << QLParser.FLOAT | 1 << QLParser.FORALL | 1 << QLParser.FOREX | 1 << QLParser.IF | 1 << QLParser.INT | 1 << QLParser.MAX | 1 << QLParser.MIN | 1 << QLParser.NOT | 1 << QLParser.NONE)) !== 0 || (_la - 35 & ~0x1f) == 0 && (1 << _la - 35 & (1 << QLParser.RANK - 35 | 1 << QLParser.RESULT - 35 | 1 << QLParser.STRICTCOUNT - 35 | 1 << QLParser.STRICTSUM - 35 | 1 << QLParser.STRICTCONCAT - 35 | 1 << QLParser.CONCAT - 35 | 1 << QLParser.STRING - 35 | 1 << QLParser.SUM - 35 | 1 << QLParser.SUPER - 35 | 1 << QLParser.THIS - 35 | 1 << QLParser.TRUE - 35 | 1 << QLParser.MINUS - 35 | 1 << QLParser.OPAR - 35 | 1 << QLParser.OBLOCK - 35)) !== 0 || (_la - 70 & ~0x1f) == 0 && (1 << _la - 70 & (1 << QLParser.PLUS - 70 | 1 << QLParser.Lowerid - 70 | 1 << QLParser.Upperid - 70 | 1 << QLParser.Atlowerid - 70 | 1 << QLParser.Integer - 70 | 1 << QLParser.Float - 70 | 1 << QLParser.String - 70)) !== 0) {
	                        this.state = 490;
	                        this.exprOrTerm(0);
	                    }

	                    this.state = 498;
	                    this._errHandler.sync(this);
	                    _la = this._input.LA(1);
	                    if (_la === QLParser.BAR) {
	                        this.state = 493;
	                        this.match(QLParser.BAR);
	                        this.state = 494;
	                        this.asExprs();
	                        this.state = 496;
	                        this._errHandler.sync(this);
	                        _la = this._input.LA(1);
	                        if (_la === QLParser.ORDER) {
	                            this.state = 495;
	                            this.orderBys();
	                        }
	                    }
	                }

	                break;

	            case 2:
	                localctx = new ExprAggBodyContext(this, localctx);
	                this.enterOuterAlt(localctx, 2);
	                this.state = 502;
	                this.asExprs();
	                this.state = 504;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	                if (_la === QLParser.ORDER) {
	                    this.state = 503;
	                    this.orderBys();
	                }

	                break;

	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function LiteralContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_literal;
	    return this;
	}

	LiteralContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	LiteralContext.prototype.constructor = LiteralContext;

	LiteralContext.prototype.copyFrom = function (ctx) {
	    antlr4.ParserRuleContext.prototype.copyFrom.call(this, ctx);
	};

	function FloatLitContext(parser, ctx) {
	    LiteralContext.call(this, parser);
	    LiteralContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	FloatLitContext.prototype = Object.create(LiteralContext.prototype);
	FloatLitContext.prototype.constructor = FloatLitContext;

	QLParser.FloatLitContext = FloatLitContext;

	FloatLitContext.prototype.Float = function () {
	    return this.getToken(QLParser.Float, 0);
	};
	FloatLitContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitFloatLit(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function IntLitContext(parser, ctx) {
	    LiteralContext.call(this, parser);
	    LiteralContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	IntLitContext.prototype = Object.create(LiteralContext.prototype);
	IntLitContext.prototype.constructor = IntLitContext;

	QLParser.IntLitContext = IntLitContext;

	IntLitContext.prototype.Integer = function () {
	    return this.getToken(QLParser.Integer, 0);
	};
	IntLitContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitIntLit(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function BoolLitContext(parser, ctx) {
	    LiteralContext.call(this, parser);
	    LiteralContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	BoolLitContext.prototype = Object.create(LiteralContext.prototype);
	BoolLitContext.prototype.constructor = BoolLitContext;

	QLParser.BoolLitContext = BoolLitContext;

	BoolLitContext.prototype.bool = function () {
	    return this.getTypedRuleContext(BoolContext, 0);
	};
	BoolLitContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitBoolLit(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function StringLitContext(parser, ctx) {
	    LiteralContext.call(this, parser);
	    LiteralContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	StringLitContext.prototype = Object.create(LiteralContext.prototype);
	StringLitContext.prototype.constructor = StringLitContext;

	QLParser.StringLitContext = StringLitContext;

	StringLitContext.prototype.String = function () {
	    return this.getToken(QLParser.String, 0);
	};
	StringLitContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitStringLit(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.LiteralContext = LiteralContext;

	QLParser.prototype.literal = function () {

	    var localctx = new LiteralContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 64, QLParser.RULE_literal);
	    try {
	        this.state = 512;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.Integer:
	                localctx = new IntLitContext(this, localctx);
	                this.enterOuterAlt(localctx, 1);
	                this.state = 508;
	                this.match(QLParser.Integer);
	                break;
	            case QLParser.Float:
	                localctx = new FloatLitContext(this, localctx);
	                this.enterOuterAlt(localctx, 2);
	                this.state = 509;
	                this.match(QLParser.Float);
	                break;
	            case QLParser.FALSE:
	            case QLParser.TRUE:
	                localctx = new BoolLitContext(this, localctx);
	                this.enterOuterAlt(localctx, 3);
	                this.state = 510;
	                this.bool();
	                break;
	            case QLParser.String:
	                localctx = new StringLitContext(this, localctx);
	                this.enterOuterAlt(localctx, 4);
	                this.state = 511;
	                this.match(QLParser.String);
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function BoolContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_bool;
	    return this;
	}

	BoolContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	BoolContext.prototype.constructor = BoolContext;

	BoolContext.prototype.TRUE = function () {
	    return this.getToken(QLParser.TRUE, 0);
	};

	BoolContext.prototype.FALSE = function () {
	    return this.getToken(QLParser.FALSE, 0);
	};

	BoolContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitBool(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.BoolContext = BoolContext;

	QLParser.prototype.bool = function () {

	    var localctx = new BoolContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 66, QLParser.RULE_bool);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 514;
	        _la = this._input.LA(1);
	        if (!(_la === QLParser.FALSE || _la === QLParser.TRUE)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function VariableContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_variable;
	    return this;
	}

	VariableContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	VariableContext.prototype.constructor = VariableContext;

	VariableContext.prototype.THIS = function () {
	    return this.getToken(QLParser.THIS, 0);
	};

	VariableContext.prototype.RESULT = function () {
	    return this.getToken(QLParser.RESULT, 0);
	};

	VariableContext.prototype.varName = function () {
	    return this.getTypedRuleContext(VarNameContext, 0);
	};

	VariableContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitVariable(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.VariableContext = VariableContext;

	QLParser.prototype.variable = function () {

	    var localctx = new VariableContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 68, QLParser.RULE_variable);
	    try {
	        this.state = 519;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.THIS:
	                this.enterOuterAlt(localctx, 1);
	                this.state = 516;
	                this.match(QLParser.THIS);
	                break;
	            case QLParser.RESULT:
	                this.enterOuterAlt(localctx, 2);
	                this.state = 517;
	                this.match(QLParser.RESULT);
	                break;
	            case QLParser.Lowerid:
	            case QLParser.Upperid:
	                this.enterOuterAlt(localctx, 3);
	                this.state = 518;
	                this.varName();
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function CompopContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_compop;
	    return this;
	}

	CompopContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	CompopContext.prototype.constructor = CompopContext;

	CompopContext.prototype.EQ = function () {
	    return this.getToken(QLParser.EQ, 0);
	};

	CompopContext.prototype.NE = function () {
	    return this.getToken(QLParser.NE, 0);
	};

	CompopContext.prototype.LT = function () {
	    return this.getToken(QLParser.LT, 0);
	};

	CompopContext.prototype.GT = function () {
	    return this.getToken(QLParser.GT, 0);
	};

	CompopContext.prototype.LE = function () {
	    return this.getToken(QLParser.LE, 0);
	};

	CompopContext.prototype.GE = function () {
	    return this.getToken(QLParser.GE, 0);
	};

	CompopContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitCompop(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.CompopContext = CompopContext;

	QLParser.prototype.compop = function () {

	    var localctx = new CompopContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 70, QLParser.RULE_compop);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 521;
	        _la = this._input.LA(1);
	        if (!((_la - 49 & ~0x1f) == 0 && (1 << _la - 49 & (1 << QLParser.LT - 49 | 1 << QLParser.LE - 49 | 1 << QLParser.EQ - 49 | 1 << QLParser.GT - 49 | 1 << QLParser.GE - 49 | 1 << QLParser.NE - 49)) !== 0)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function UnopContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_unop;
	    return this;
	}

	UnopContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	UnopContext.prototype.constructor = UnopContext;

	UnopContext.prototype.PLUS = function () {
	    return this.getToken(QLParser.PLUS, 0);
	};

	UnopContext.prototype.MINUS = function () {
	    return this.getToken(QLParser.MINUS, 0);
	};

	UnopContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitUnop(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.UnopContext = UnopContext;

	QLParser.prototype.unop = function () {

	    var localctx = new UnopContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 72, QLParser.RULE_unop);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 523;
	        _la = this._input.LA(1);
	        if (!(_la === QLParser.MINUS || _la === QLParser.PLUS)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function MulopContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_mulop;
	    return this;
	}

	MulopContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	MulopContext.prototype.constructor = MulopContext;

	MulopContext.prototype.STAR = function () {
	    return this.getToken(QLParser.STAR, 0);
	};

	MulopContext.prototype.SLASH = function () {
	    return this.getToken(QLParser.SLASH, 0);
	};

	MulopContext.prototype.MOD = function () {
	    return this.getToken(QLParser.MOD, 0);
	};

	MulopContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitMulop(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.MulopContext = MulopContext;

	QLParser.prototype.mulop = function () {

	    var localctx = new MulopContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 74, QLParser.RULE_mulop);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 525;
	        _la = this._input.LA(1);
	        if (!((_la - 59 & ~0x1f) == 0 && (1 << _la - 59 & (1 << QLParser.SLASH - 59 | 1 << QLParser.STAR - 59 | 1 << QLParser.MOD - 59)) !== 0)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function AddopContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_addop;
	    return this;
	}

	AddopContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	AddopContext.prototype.constructor = AddopContext;

	AddopContext.prototype.PLUS = function () {
	    return this.getToken(QLParser.PLUS, 0);
	};

	AddopContext.prototype.MINUS = function () {
	    return this.getToken(QLParser.MINUS, 0);
	};

	AddopContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitAddop(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.AddopContext = AddopContext;

	QLParser.prototype.addop = function () {

	    var localctx = new AddopContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 76, QLParser.RULE_addop);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 527;
	        _la = this._input.LA(1);
	        if (!(_la === QLParser.MINUS || _la === QLParser.PLUS)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ClosureContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_closure;
	    return this;
	}

	ClosureContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ClosureContext.prototype.constructor = ClosureContext;

	ClosureContext.prototype.STAR = function () {
	    return this.getToken(QLParser.STAR, 0);
	};

	ClosureContext.prototype.PLUS = function () {
	    return this.getToken(QLParser.PLUS, 0);
	};

	ClosureContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitClosure(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ClosureContext = ClosureContext;

	QLParser.prototype.closure = function () {

	    var localctx = new ClosureContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 78, QLParser.RULE_closure);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 529;
	        _la = this._input.LA(1);
	        if (!(_la === QLParser.STAR || _la === QLParser.PLUS)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function DirectionContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_direction;
	    return this;
	}

	DirectionContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	DirectionContext.prototype.constructor = DirectionContext;

	DirectionContext.prototype.ASC = function () {
	    return this.getToken(QLParser.ASC, 0);
	};

	DirectionContext.prototype.DESC = function () {
	    return this.getToken(QLParser.DESC, 0);
	};

	DirectionContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitDirection(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.DirectionContext = DirectionContext;

	QLParser.prototype.direction = function () {

	    var localctx = new DirectionContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 80, QLParser.RULE_direction);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 531;
	        _la = this._input.LA(1);
	        if (!(_la === QLParser.ASC || _la === QLParser.DESC)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function VarDeclsContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_varDecls;
	    return this;
	}

	VarDeclsContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	VarDeclsContext.prototype.constructor = VarDeclsContext;

	VarDeclsContext.prototype.varDecl = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(VarDeclContext);
	    } else {
	        return this.getTypedRuleContext(VarDeclContext, i);
	    }
	};

	VarDeclsContext.prototype.COMMA = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.COMMA);
	    } else {
	        return this.getToken(QLParser.COMMA, i);
	    }
	};

	VarDeclsContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitVarDecls(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.VarDeclsContext = VarDeclsContext;

	QLParser.prototype.varDecls = function () {

	    var localctx = new VarDeclsContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 82, QLParser.RULE_varDecls);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 541;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if ((_la & ~0x1f) == 0 && (1 << _la & (1 << QLParser.BOOLEAN | 1 << QLParser.DATE | 1 << QLParser.FLOAT | 1 << QLParser.INT)) !== 0 || _la === QLParser.STRING || _la === QLParser.Lowerid || _la === QLParser.Upperid || _la === QLParser.Atlowerid) {
	            this.state = 533;
	            this.varDecl();
	            this.state = 538;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	            while (_la === QLParser.COMMA) {
	                this.state = 534;
	                this.match(QLParser.COMMA);
	                this.state = 535;
	                this.varDecl();
	                this.state = 540;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	            }
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function VarDeclContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_varDecl;
	    return this;
	}

	VarDeclContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	VarDeclContext.prototype.constructor = VarDeclContext;

	VarDeclContext.prototype.typeExpr = function () {
	    return this.getTypedRuleContext(TypeExprContext, 0);
	};

	VarDeclContext.prototype.varName = function () {
	    return this.getTypedRuleContext(VarNameContext, 0);
	};

	VarDeclContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitVarDecl(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.VarDeclContext = VarDeclContext;

	QLParser.prototype.varDecl = function () {

	    var localctx = new VarDeclContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 84, QLParser.RULE_varDecl);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 543;
	        this.typeExpr();
	        this.state = 544;
	        this.varName();
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function AsExprsContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_asExprs;
	    return this;
	}

	AsExprsContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	AsExprsContext.prototype.constructor = AsExprsContext;

	AsExprsContext.prototype.asExpr = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(AsExprContext);
	    } else {
	        return this.getTypedRuleContext(AsExprContext, i);
	    }
	};

	AsExprsContext.prototype.COMMA = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.COMMA);
	    } else {
	        return this.getToken(QLParser.COMMA, i);
	    }
	};

	AsExprsContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitAsExprs(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.AsExprsContext = AsExprsContext;

	QLParser.prototype.asExprs = function () {

	    var localctx = new AsExprsContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 86, QLParser.RULE_asExprs);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 546;
	        this.asExpr();
	        this.state = 551;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while (_la === QLParser.COMMA) {
	            this.state = 547;
	            this.match(QLParser.COMMA);
	            this.state = 548;
	            this.asExpr();
	            this.state = 553;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function AsExprContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_asExpr;
	    return this;
	}

	AsExprContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	AsExprContext.prototype.constructor = AsExprContext;

	AsExprContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};

	AsExprContext.prototype.AS = function () {
	    return this.getToken(QLParser.AS, 0);
	};

	AsExprContext.prototype.simpleId = function () {
	    return this.getTypedRuleContext(SimpleIdContext, 0);
	};

	AsExprContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitAsExpr(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.AsExprContext = AsExprContext;

	QLParser.prototype.asExpr = function () {

	    var localctx = new AsExprContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 88, QLParser.RULE_asExpr);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 554;
	        this.exprOrTerm(0);
	        this.state = 557;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if (_la === QLParser.AS) {
	            this.state = 555;
	            this.match(QLParser.AS);
	            this.state = 556;
	            this.simpleId();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function OrderBysContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_orderBys;
	    return this;
	}

	OrderBysContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	OrderBysContext.prototype.constructor = OrderBysContext;

	OrderBysContext.prototype.ORDER = function () {
	    return this.getToken(QLParser.ORDER, 0);
	};

	OrderBysContext.prototype.BY = function () {
	    return this.getToken(QLParser.BY, 0);
	};

	OrderBysContext.prototype.orderBy = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(OrderByContext);
	    } else {
	        return this.getTypedRuleContext(OrderByContext, i);
	    }
	};

	OrderBysContext.prototype.COMMA = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.COMMA);
	    } else {
	        return this.getToken(QLParser.COMMA, i);
	    }
	};

	OrderBysContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitOrderBys(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.OrderBysContext = OrderBysContext;

	QLParser.prototype.orderBys = function () {

	    var localctx = new OrderBysContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 90, QLParser.RULE_orderBys);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 559;
	        this.match(QLParser.ORDER);
	        this.state = 560;
	        this.match(QLParser.BY);
	        this.state = 561;
	        this.orderBy();
	        this.state = 566;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while (_la === QLParser.COMMA) {
	            this.state = 562;
	            this.match(QLParser.COMMA);
	            this.state = 563;
	            this.orderBy();
	            this.state = 568;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function OrderByContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_orderBy;
	    return this;
	}

	OrderByContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	OrderByContext.prototype.constructor = OrderByContext;

	OrderByContext.prototype.exprOrTerm = function () {
	    return this.getTypedRuleContext(ExprOrTermContext, 0);
	};

	OrderByContext.prototype.direction = function () {
	    return this.getTypedRuleContext(DirectionContext, 0);
	};

	OrderByContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitOrderBy(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.OrderByContext = OrderByContext;

	QLParser.prototype.orderBy = function () {

	    var localctx = new OrderByContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 92, QLParser.RULE_orderBy);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 569;
	        this.exprOrTerm(0);
	        this.state = 571;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if (_la === QLParser.ASC || _la === QLParser.DESC) {
	            this.state = 570;
	            this.direction();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function QldocContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_qldoc;
	    return this;
	}

	QldocContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	QldocContext.prototype.constructor = QldocContext;

	QldocContext.prototype.StartQLDoc = function () {
	    return this.getToken(QLParser.StartQLDoc, 0);
	};

	QldocContext.prototype.EndQLDoc = function () {
	    return this.getToken(QLParser.EndQLDoc, 0);
	};

	QldocContext.prototype.qldocSegment = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(QldocSegmentContext);
	    } else {
	        return this.getTypedRuleContext(QldocSegmentContext, i);
	    }
	};

	QldocContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitQldoc(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.QldocContext = QldocContext;

	QLParser.prototype.qldoc = function () {

	    var localctx = new QldocContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 94, QLParser.RULE_qldoc);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 573;
	        this.match(QLParser.StartQLDoc);
	        this.state = 577;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while (_la === QLParser.CONTENT) {
	            this.state = 574;
	            this.qldocSegment();
	            this.state = 579;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	        this.state = 580;
	        this.match(QLParser.EndQLDoc);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function QldocSegmentContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_qldocSegment;
	    return this;
	}

	QldocSegmentContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	QldocSegmentContext.prototype.constructor = QldocSegmentContext;

	QldocSegmentContext.prototype.copyFrom = function (ctx) {
	    antlr4.ParserRuleContext.prototype.copyFrom.call(this, ctx);
	};

	function QLDocTextSegmentContext(parser, ctx) {
	    QldocSegmentContext.call(this, parser);
	    QldocSegmentContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	QLDocTextSegmentContext.prototype = Object.create(QldocSegmentContext.prototype);
	QLDocTextSegmentContext.prototype.constructor = QLDocTextSegmentContext;

	QLParser.QLDocTextSegmentContext = QLDocTextSegmentContext;

	QLDocTextSegmentContext.prototype.CONTENT = function () {
	    return this.getToken(QLParser.CONTENT, 0);
	};
	QLDocTextSegmentContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitQLDocTextSegment(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.QldocSegmentContext = QldocSegmentContext;

	QLParser.prototype.qldocSegment = function () {

	    var localctx = new QldocSegmentContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 96, QLParser.RULE_qldocSegment);
	    try {
	        localctx = new QLDocTextSegmentContext(this, localctx);
	        this.enterOuterAlt(localctx, 1);
	        this.state = 582;
	        this.match(QLParser.CONTENT);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function SimpleIdContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_simpleId;
	    return this;
	}

	SimpleIdContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	SimpleIdContext.prototype.constructor = SimpleIdContext;

	SimpleIdContext.prototype.Lowerid = function () {
	    return this.getToken(QLParser.Lowerid, 0);
	};

	SimpleIdContext.prototype.Upperid = function () {
	    return this.getToken(QLParser.Upperid, 0);
	};

	SimpleIdContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitSimpleId(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.SimpleIdContext = SimpleIdContext;

	QLParser.prototype.simpleId = function () {

	    var localctx = new SimpleIdContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 98, QLParser.RULE_simpleId);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 584;
	        _la = this._input.LA(1);
	        if (!(_la === QLParser.Lowerid || _la === QLParser.Upperid)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function LiteralIdContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_literalId;
	    return this;
	}

	LiteralIdContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	LiteralIdContext.prototype.constructor = LiteralIdContext;

	LiteralIdContext.prototype.Lowerid = function () {
	    return this.getToken(QLParser.Lowerid, 0);
	};

	LiteralIdContext.prototype.Atlowerid = function () {
	    return this.getToken(QLParser.Atlowerid, 0);
	};

	LiteralIdContext.prototype.Upperid = function () {
	    return this.getToken(QLParser.Upperid, 0);
	};

	LiteralIdContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitLiteralId(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.LiteralIdContext = LiteralIdContext;

	QLParser.prototype.literalId = function () {

	    var localctx = new LiteralIdContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 100, QLParser.RULE_literalId);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 586;
	        _la = this._input.LA(1);
	        if (!((_la - 73 & ~0x1f) == 0 && (1 << _la - 73 & (1 << QLParser.Lowerid - 73 | 1 << QLParser.Upperid - 73 | 1 << QLParser.Atlowerid - 73)) !== 0)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function AnnotationContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_annotation;
	    return this;
	}

	AnnotationContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	AnnotationContext.prototype.constructor = AnnotationContext;

	AnnotationContext.prototype.copyFrom = function (ctx) {
	    antlr4.ParserRuleContext.prototype.copyFrom.call(this, ctx);
	};

	function SimpleAnnotationContext(parser, ctx) {
	    AnnotationContext.call(this, parser);
	    this.name = null; // AnnotNameContext;
	    AnnotationContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	SimpleAnnotationContext.prototype = Object.create(AnnotationContext.prototype);
	SimpleAnnotationContext.prototype.constructor = SimpleAnnotationContext;

	QLParser.SimpleAnnotationContext = SimpleAnnotationContext;

	SimpleAnnotationContext.prototype.annotName = function () {
	    return this.getTypedRuleContext(AnnotNameContext, 0);
	};
	SimpleAnnotationContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitSimpleAnnotation(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	function ArgsAnnotationContext(parser, ctx) {
	    AnnotationContext.call(this, parser);
	    this.name = null; // AnnotNameContext;
	    this._annotArg = null; // AnnotArgContext;
	    this.args = []; // of AnnotArgContexts;
	    AnnotationContext.prototype.copyFrom.call(this, ctx);
	    return this;
	}

	ArgsAnnotationContext.prototype = Object.create(AnnotationContext.prototype);
	ArgsAnnotationContext.prototype.constructor = ArgsAnnotationContext;

	QLParser.ArgsAnnotationContext = ArgsAnnotationContext;

	ArgsAnnotationContext.prototype.OBLOCK = function () {
	    return this.getToken(QLParser.OBLOCK, 0);
	};

	ArgsAnnotationContext.prototype.CBLOCK = function () {
	    return this.getToken(QLParser.CBLOCK, 0);
	};

	ArgsAnnotationContext.prototype.annotName = function () {
	    return this.getTypedRuleContext(AnnotNameContext, 0);
	};

	ArgsAnnotationContext.prototype.annotArg = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(AnnotArgContext);
	    } else {
	        return this.getTypedRuleContext(AnnotArgContext, i);
	    }
	};

	ArgsAnnotationContext.prototype.COMMA = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.COMMA);
	    } else {
	        return this.getToken(QLParser.COMMA, i);
	    }
	};

	ArgsAnnotationContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitArgsAnnotation(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.AnnotationContext = AnnotationContext;

	QLParser.prototype.annotation = function () {

	    var localctx = new AnnotationContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 102, QLParser.RULE_annotation);
	    var _la = 0; // Token type
	    try {
	        this.state = 601;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input, 56, this._ctx);
	        switch (la_) {
	            case 1:
	                localctx = new SimpleAnnotationContext(this, localctx);
	                this.enterOuterAlt(localctx, 1);
	                this.state = 588;
	                localctx.name = this.annotName();
	                break;

	            case 2:
	                localctx = new ArgsAnnotationContext(this, localctx);
	                this.enterOuterAlt(localctx, 2);
	                this.state = 589;
	                localctx.name = this.annotName();
	                this.state = 590;
	                this.match(QLParser.OBLOCK);
	                this.state = 591;
	                localctx._annotArg = this.annotArg();
	                localctx.args.push(localctx._annotArg);
	                this.state = 596;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	                while (_la === QLParser.COMMA) {
	                    this.state = 592;
	                    this.match(QLParser.COMMA);
	                    this.state = 593;
	                    localctx._annotArg = this.annotArg();
	                    localctx.args.push(localctx._annotArg);
	                    this.state = 598;
	                    this._errHandler.sync(this);
	                    _la = this._input.LA(1);
	                }
	                this.state = 599;
	                this.match(QLParser.CBLOCK);
	                break;

	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function AnnotNameContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_annotName;
	    return this;
	}

	AnnotNameContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	AnnotNameContext.prototype.constructor = AnnotNameContext;

	AnnotNameContext.prototype.Lowerid = function () {
	    return this.getToken(QLParser.Lowerid, 0);
	};

	AnnotNameContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitAnnotName(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.AnnotNameContext = AnnotNameContext;

	QLParser.prototype.annotName = function () {

	    var localctx = new AnnotNameContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 104, QLParser.RULE_annotName);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 603;
	        this.match(QLParser.Lowerid);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function AnnotArgContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_annotArg;
	    return this;
	}

	AnnotArgContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	AnnotArgContext.prototype.constructor = AnnotArgContext;

	AnnotArgContext.prototype.simpleId = function () {
	    return this.getTypedRuleContext(SimpleIdContext, 0);
	};

	AnnotArgContext.prototype.THIS = function () {
	    return this.getToken(QLParser.THIS, 0);
	};

	AnnotArgContext.prototype.RESULT = function () {
	    return this.getToken(QLParser.RESULT, 0);
	};

	AnnotArgContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitAnnotArg(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.AnnotArgContext = AnnotArgContext;

	QLParser.prototype.annotArg = function () {

	    var localctx = new AnnotArgContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 106, QLParser.RULE_annotArg);
	    try {
	        this.state = 608;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.Lowerid:
	            case QLParser.Upperid:
	                this.enterOuterAlt(localctx, 1);
	                this.state = 605;
	                this.simpleId();
	                break;
	            case QLParser.THIS:
	                this.enterOuterAlt(localctx, 2);
	                this.state = 606;
	                this.match(QLParser.THIS);
	                break;
	            case QLParser.RESULT:
	                this.enterOuterAlt(localctx, 3);
	                this.state = 607;
	                this.match(QLParser.RESULT);
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ModuleNameContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_moduleName;
	    return this;
	}

	ModuleNameContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ModuleNameContext.prototype.constructor = ModuleNameContext;

	ModuleNameContext.prototype.simpleId = function () {
	    return this.getTypedRuleContext(SimpleIdContext, 0);
	};

	ModuleNameContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitModuleName(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ModuleNameContext = ModuleNameContext;

	QLParser.prototype.moduleName = function () {

	    var localctx = new ModuleNameContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 108, QLParser.RULE_moduleName);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 610;
	        this.simpleId();
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function QualModuleExprContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_qualModuleExpr;
	    return this;
	}

	QualModuleExprContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	QualModuleExprContext.prototype.constructor = QualModuleExprContext;

	QualModuleExprContext.prototype.simpleId = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(SimpleIdContext);
	    } else {
	        return this.getTypedRuleContext(SimpleIdContext, i);
	    }
	};

	QualModuleExprContext.prototype.DOT = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.DOT);
	    } else {
	        return this.getToken(QLParser.DOT, i);
	    }
	};

	QualModuleExprContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitQualModuleExpr(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.QualModuleExprContext = QualModuleExprContext;

	QLParser.prototype.qualModuleExpr = function () {

	    var localctx = new QualModuleExprContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 110, QLParser.RULE_qualModuleExpr);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 612;
	        this.simpleId();
	        this.state = 617;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while (_la === QLParser.DOT) {
	            this.state = 613;
	            this.match(QLParser.DOT);
	            this.state = 614;
	            this.simpleId();
	            this.state = 619;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ImportModuleExprContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_importModuleExpr;
	    return this;
	}

	ImportModuleExprContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ImportModuleExprContext.prototype.constructor = ImportModuleExprContext;

	ImportModuleExprContext.prototype.qualModuleExpr = function () {
	    return this.getTypedRuleContext(QualModuleExprContext, 0);
	};

	ImportModuleExprContext.prototype.SELECTION = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.SELECTION);
	    } else {
	        return this.getToken(QLParser.SELECTION, i);
	    }
	};

	ImportModuleExprContext.prototype.simpleId = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(SimpleIdContext);
	    } else {
	        return this.getTypedRuleContext(SimpleIdContext, i);
	    }
	};

	ImportModuleExprContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitImportModuleExpr(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ImportModuleExprContext = ImportModuleExprContext;

	QLParser.prototype.importModuleExpr = function () {

	    var localctx = new ImportModuleExprContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 112, QLParser.RULE_importModuleExpr);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 620;
	        this.qualModuleExpr();
	        this.state = 625;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while (_la === QLParser.SELECTION) {
	            this.state = 621;
	            this.match(QLParser.SELECTION);
	            this.state = 622;
	            this.simpleId();
	            this.state = 627;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ModuleExprContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_moduleExpr;
	    return this;
	}

	ModuleExprContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ModuleExprContext.prototype.constructor = ModuleExprContext;

	ModuleExprContext.prototype.simpleId = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTypedRuleContexts(SimpleIdContext);
	    } else {
	        return this.getTypedRuleContext(SimpleIdContext, i);
	    }
	};

	ModuleExprContext.prototype.SELECTION = function (i) {
	    if (i === undefined) {
	        i = null;
	    }
	    if (i === null) {
	        return this.getTokens(QLParser.SELECTION);
	    } else {
	        return this.getToken(QLParser.SELECTION, i);
	    }
	};

	ModuleExprContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitModuleExpr(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ModuleExprContext = ModuleExprContext;

	QLParser.prototype.moduleExpr = function () {

	    var localctx = new ModuleExprContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 114, QLParser.RULE_moduleExpr);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 628;
	        this.simpleId();
	        this.state = 633;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input, 60, this._ctx);
	        while (_alt != 2 && _alt != antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if (_alt === 1) {
	                this.state = 629;
	                this.match(QLParser.SELECTION);
	                this.state = 630;
	                this.simpleId();
	            }
	            this.state = 635;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input, 60, this._ctx);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function TypeLiteralContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_typeLiteral;
	    return this;
	}

	TypeLiteralContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	TypeLiteralContext.prototype.constructor = TypeLiteralContext;

	TypeLiteralContext.prototype.Atlowerid = function () {
	    return this.getToken(QLParser.Atlowerid, 0);
	};

	TypeLiteralContext.prototype.BOOLEAN = function () {
	    return this.getToken(QLParser.BOOLEAN, 0);
	};

	TypeLiteralContext.prototype.DATE = function () {
	    return this.getToken(QLParser.DATE, 0);
	};

	TypeLiteralContext.prototype.FLOAT = function () {
	    return this.getToken(QLParser.FLOAT, 0);
	};

	TypeLiteralContext.prototype.INT = function () {
	    return this.getToken(QLParser.INT, 0);
	};

	TypeLiteralContext.prototype.STRING = function () {
	    return this.getToken(QLParser.STRING, 0);
	};

	TypeLiteralContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitTypeLiteral(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.TypeLiteralContext = TypeLiteralContext;

	QLParser.prototype.typeLiteral = function () {

	    var localctx = new TypeLiteralContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 116, QLParser.RULE_typeLiteral);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 636;
	        _la = this._input.LA(1);
	        if (!((_la & ~0x1f) == 0 && (1 << _la & (1 << QLParser.BOOLEAN | 1 << QLParser.DATE | 1 << QLParser.FLOAT | 1 << QLParser.INT)) !== 0 || _la === QLParser.STRING || _la === QLParser.Atlowerid)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ClassNameContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_className;
	    return this;
	}

	ClassNameContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ClassNameContext.prototype.constructor = ClassNameContext;

	ClassNameContext.prototype.Upperid = function () {
	    return this.getToken(QLParser.Upperid, 0);
	};

	ClassNameContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitClassName(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ClassNameContext = ClassNameContext;

	QLParser.prototype.className = function () {

	    var localctx = new ClassNameContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 118, QLParser.RULE_className);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 638;
	        this.match(QLParser.Upperid);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function DbtypeContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_dbtype;
	    return this;
	}

	DbtypeContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	DbtypeContext.prototype.constructor = DbtypeContext;

	DbtypeContext.prototype.Atlowerid = function () {
	    return this.getToken(QLParser.Atlowerid, 0);
	};

	DbtypeContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitDbtype(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.DbtypeContext = DbtypeContext;

	QLParser.prototype.dbtype = function () {

	    var localctx = new DbtypeContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 120, QLParser.RULE_dbtype);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 640;
	        this.match(QLParser.Atlowerid);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function ReturnTypeContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_returnType;
	    return this;
	}

	ReturnTypeContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	ReturnTypeContext.prototype.constructor = ReturnTypeContext;

	ReturnTypeContext.prototype.PREDICATE = function () {
	    return this.getToken(QLParser.PREDICATE, 0);
	};

	ReturnTypeContext.prototype.typeExpr = function () {
	    return this.getTypedRuleContext(TypeExprContext, 0);
	};

	ReturnTypeContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitReturnType(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.ReturnTypeContext = ReturnTypeContext;

	QLParser.prototype.returnType = function () {

	    var localctx = new ReturnTypeContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 122, QLParser.RULE_returnType);
	    try {
	        this.state = 644;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.PREDICATE:
	                this.enterOuterAlt(localctx, 1);
	                this.state = 642;
	                this.match(QLParser.PREDICATE);
	                break;
	            case QLParser.BOOLEAN:
	            case QLParser.DATE:
	            case QLParser.FLOAT:
	            case QLParser.INT:
	            case QLParser.STRING:
	            case QLParser.Lowerid:
	            case QLParser.Upperid:
	            case QLParser.Atlowerid:
	                this.enterOuterAlt(localctx, 2);
	                this.state = 643;
	                this.typeExpr();
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function TypeExprContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_typeExpr;
	    return this;
	}

	TypeExprContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	TypeExprContext.prototype.constructor = TypeExprContext;

	TypeExprContext.prototype.Upperid = function () {
	    return this.getToken(QLParser.Upperid, 0);
	};

	TypeExprContext.prototype.moduleExpr = function () {
	    return this.getTypedRuleContext(ModuleExprContext, 0);
	};

	TypeExprContext.prototype.SELECTION = function () {
	    return this.getToken(QLParser.SELECTION, 0);
	};

	TypeExprContext.prototype.typeLiteral = function () {
	    return this.getTypedRuleContext(TypeLiteralContext, 0);
	};

	TypeExprContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitTypeExpr(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.TypeExprContext = TypeExprContext;

	QLParser.prototype.typeExpr = function () {

	    var localctx = new TypeExprContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 124, QLParser.RULE_typeExpr);
	    try {
	        this.state = 653;
	        this._errHandler.sync(this);
	        switch (this._input.LA(1)) {
	            case QLParser.Lowerid:
	            case QLParser.Upperid:
	                this.enterOuterAlt(localctx, 1);
	                this.state = 649;
	                this._errHandler.sync(this);
	                var la_ = this._interp.adaptivePredict(this._input, 62, this._ctx);
	                if (la_ === 1) {
	                    this.state = 646;
	                    this.moduleExpr();
	                    this.state = 647;
	                    this.match(QLParser.SELECTION);
	                }
	                this.state = 651;
	                this.match(QLParser.Upperid);
	                break;
	            case QLParser.BOOLEAN:
	            case QLParser.DATE:
	            case QLParser.FLOAT:
	            case QLParser.INT:
	            case QLParser.STRING:
	            case QLParser.Atlowerid:
	                this.enterOuterAlt(localctx, 2);
	                this.state = 652;
	                this.typeLiteral();
	                break;
	            default:
	                throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function PredicateNameContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_predicateName;
	    return this;
	}

	PredicateNameContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	PredicateNameContext.prototype.constructor = PredicateNameContext;

	PredicateNameContext.prototype.Lowerid = function () {
	    return this.getToken(QLParser.Lowerid, 0);
	};

	PredicateNameContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitPredicateName(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.PredicateNameContext = PredicateNameContext;

	QLParser.prototype.predicateName = function () {

	    var localctx = new PredicateNameContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 126, QLParser.RULE_predicateName);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 655;
	        this.match(QLParser.Lowerid);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function AritylessPredicateExprContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_aritylessPredicateExpr;
	    return this;
	}

	AritylessPredicateExprContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	AritylessPredicateExprContext.prototype.constructor = AritylessPredicateExprContext;

	AritylessPredicateExprContext.prototype.literalId = function () {
	    return this.getTypedRuleContext(LiteralIdContext, 0);
	};

	AritylessPredicateExprContext.prototype.moduleExpr = function () {
	    return this.getTypedRuleContext(ModuleExprContext, 0);
	};

	AritylessPredicateExprContext.prototype.SELECTION = function () {
	    return this.getToken(QLParser.SELECTION, 0);
	};

	AritylessPredicateExprContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitAritylessPredicateExpr(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.AritylessPredicateExprContext = AritylessPredicateExprContext;

	QLParser.prototype.aritylessPredicateExpr = function () {

	    var localctx = new AritylessPredicateExprContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 128, QLParser.RULE_aritylessPredicateExpr);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 660;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input, 64, this._ctx);
	        if (la_ === 1) {
	            this.state = 657;
	            this.moduleExpr();
	            this.state = 658;
	            this.match(QLParser.SELECTION);
	        }
	        this.state = 662;
	        this.literalId();
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function PredicateExprContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_predicateExpr;
	    return this;
	}

	PredicateExprContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	PredicateExprContext.prototype.constructor = PredicateExprContext;

	PredicateExprContext.prototype.aritylessPredicateExpr = function () {
	    return this.getTypedRuleContext(AritylessPredicateExprContext, 0);
	};

	PredicateExprContext.prototype.SLASH = function () {
	    return this.getToken(QLParser.SLASH, 0);
	};

	PredicateExprContext.prototype.Integer = function () {
	    return this.getToken(QLParser.Integer, 0);
	};

	PredicateExprContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitPredicateExpr(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.PredicateExprContext = PredicateExprContext;

	QLParser.prototype.predicateExpr = function () {

	    var localctx = new PredicateExprContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 130, QLParser.RULE_predicateExpr);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 664;
	        this.aritylessPredicateExpr();
	        this.state = 665;
	        this.match(QLParser.SLASH);
	        this.state = 666;
	        this.match(QLParser.Integer);
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function VarNameContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_varName;
	    return this;
	}

	VarNameContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	VarNameContext.prototype.constructor = VarNameContext;

	VarNameContext.prototype.simpleId = function () {
	    return this.getTypedRuleContext(SimpleIdContext, 0);
	};

	VarNameContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitVarName(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.VarNameContext = VarNameContext;

	QLParser.prototype.varName = function () {

	    var localctx = new VarNameContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 132, QLParser.RULE_varName);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 668;
	        this.simpleId();
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	function AggIdContext(parser, parent, invokingState) {
	    if (parent === undefined) {
	        parent = null;
	    }
	    if (invokingState === undefined || invokingState === null) {
	        invokingState = -1;
	    }
	    antlr4.ParserRuleContext.call(this, parent, invokingState);
	    this.parser = parser;
	    this.ruleIndex = QLParser.RULE_aggId;
	    return this;
	}

	AggIdContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
	AggIdContext.prototype.constructor = AggIdContext;

	AggIdContext.prototype.AVG = function () {
	    return this.getToken(QLParser.AVG, 0);
	};

	AggIdContext.prototype.CONCAT = function () {
	    return this.getToken(QLParser.CONCAT, 0);
	};

	AggIdContext.prototype.STRICTCONCAT = function () {
	    return this.getToken(QLParser.STRICTCONCAT, 0);
	};

	AggIdContext.prototype.COUNT = function () {
	    return this.getToken(QLParser.COUNT, 0);
	};

	AggIdContext.prototype.MAX = function () {
	    return this.getToken(QLParser.MAX, 0);
	};

	AggIdContext.prototype.MIN = function () {
	    return this.getToken(QLParser.MIN, 0);
	};

	AggIdContext.prototype.RANK = function () {
	    return this.getToken(QLParser.RANK, 0);
	};

	AggIdContext.prototype.STRICTCOUNT = function () {
	    return this.getToken(QLParser.STRICTCOUNT, 0);
	};

	AggIdContext.prototype.STRICTSUM = function () {
	    return this.getToken(QLParser.STRICTSUM, 0);
	};

	AggIdContext.prototype.SUM = function () {
	    return this.getToken(QLParser.SUM, 0);
	};

	AggIdContext.prototype.ANY = function () {
	    return this.getToken(QLParser.ANY, 0);
	};

	AggIdContext.prototype.accept = function (visitor) {
	    if (visitor instanceof QLParserVisitor) {
	        return visitor.visitAggId(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	};

	QLParser.AggIdContext = AggIdContext;

	QLParser.prototype.aggId = function () {

	    var localctx = new AggIdContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 134, QLParser.RULE_aggId);
	    var _la = 0; // Token type
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 670;
	        _la = this._input.LA(1);
	        if (!((_la & ~0x1f) == 0 && (1 << _la & (1 << QLParser.ANY | 1 << QLParser.AVG | 1 << QLParser.COUNT | 1 << QLParser.MAX | 1 << QLParser.MIN)) !== 0 || (_la - 35 & ~0x1f) == 0 && (1 << _la - 35 & (1 << QLParser.RANK - 35 | 1 << QLParser.STRICTCOUNT - 35 | 1 << QLParser.STRICTSUM - 35 | 1 << QLParser.STRICTCONCAT - 35 | 1 << QLParser.CONCAT - 35 | 1 << QLParser.SUM - 35)) !== 0)) {
	            this._errHandler.recoverInline(this);
	        } else {
	            this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	        if (re instanceof antlr4.error.RecognitionException) {
	            localctx.exception = re;
	            this._errHandler.reportError(this, re);
	            this._errHandler.recover(this, re);
	        } else {
	            throw re;
	        }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	};

	QLParser.prototype.sempred = function (localctx, ruleIndex, predIndex) {
	    switch (ruleIndex) {
	        case 23:
	            return this.exprOrTerm_sempred(localctx, predIndex);
	        case 30:
	            return this.primary_sempred(localctx, predIndex);
	        default:
	            throw "No predicate with index:" + ruleIndex;
	    }
	};

	QLParser.prototype.exprOrTerm_sempred = function (localctx, predIndex) {
	    switch (predIndex) {
	        case 0:
	            return this.precpred(this._ctx, 11);
	        case 1:
	            return this.precpred(this._ctx, 10);
	        case 2:
	            return this.precpred(this._ctx, 8);
	        case 3:
	            return this.precpred(this._ctx, 4);
	        case 4:
	            return this.precpred(this._ctx, 3);
	        case 5:
	            return this.precpred(this._ctx, 2);
	        case 6:
	            return this.precpred(this._ctx, 9);
	        case 7:
	            return this.precpred(this._ctx, 7);
	        default:
	            throw "No predicate with index:" + predIndex;
	    }
	};

	QLParser.prototype.primary_sempred = function (localctx, predIndex) {
	    switch (predIndex) {
	        case 8:
	            return this.precpred(this._ctx, 7);
	        default:
	            throw "No predicate with index:" + predIndex;
	    }
	};

	exports.QLParser = QLParser;

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	// Generated from QLParser.g4 by ANTLR 4.7
	// jshint ignore: start
	var antlr4 = __webpack_require__(1);

	// This class defines a complete generic visitor for a parse tree produced by QLParser.

	function QLParserVisitor() {
	  antlr4.tree.ParseTreeVisitor.call(this);
	  return this;
	}

	QLParserVisitor.prototype = Object.create(antlr4.tree.ParseTreeVisitor.prototype);
	QLParserVisitor.prototype.constructor = QLParserVisitor;

	// Visit a parse tree produced by QLParser#fileModule.
	QLParserVisitor.prototype.visitFileModule = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#module.
	QLParserVisitor.prototype.visitModule = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#moduleBody.
	QLParserVisitor.prototype.visitModuleBody = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#moduleMember.
	QLParserVisitor.prototype.visitModuleMember = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#imprt.
	QLParserVisitor.prototype.visitImprt = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#moduleAliasBody.
	QLParserVisitor.prototype.visitModuleAliasBody = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#predicateAliasBody.
	QLParserVisitor.prototype.visitPredicateAliasBody = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#typeAliasBody.
	QLParserVisitor.prototype.visitTypeAliasBody = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#classlessPredicate.
	QLParserVisitor.prototype.visitClasslessPredicate = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#datatype.
	QLParserVisitor.prototype.visitDatatype = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#datatypeBranches.
	QLParserVisitor.prototype.visitDatatypeBranches = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#datatypeBranch.
	QLParserVisitor.prototype.visitDatatypeBranch = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#branchBody.
	QLParserVisitor.prototype.visitBranchBody = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#select.
	QLParserVisitor.prototype.visitSelect = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#dataclass.
	QLParserVisitor.prototype.visitDataclass = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#classMember.
	QLParserVisitor.prototype.visitClassMember = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#charpred.
	QLParserVisitor.prototype.visitCharpred = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#memberPredicate.
	QLParserVisitor.prototype.visitMemberPredicate = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#field.
	QLParserVisitor.prototype.visitField = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#optbody.
	QLParserVisitor.prototype.visitOptbody = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#empty.
	QLParserVisitor.prototype.visitEmpty = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#body.
	QLParserVisitor.prototype.visitBody = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#higherOrderTerm.
	QLParserVisitor.prototype.visitHigherOrderTerm = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Cast.
	QLParserVisitor.prototype.visitCast = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#In.
	QLParserVisitor.prototype.visitIn = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#AddOperation.
	QLParserVisitor.prototype.visitAddOperation = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Unary.
	QLParserVisitor.prototype.visitUnary = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#QuantifiedTerm.
	QLParserVisitor.prototype.visitQuantifiedTerm = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Not.
	QLParserVisitor.prototype.visitNot = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Disjunction.
	QLParserVisitor.prototype.visitDisjunction = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Implies.
	QLParserVisitor.prototype.visitImplies = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Comparison.
	QLParserVisitor.prototype.visitComparison = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#SpecialCall.
	QLParserVisitor.prototype.visitSpecialCall = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Conjunction.
	QLParserVisitor.prototype.visitConjunction = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Instanceof.
	QLParserVisitor.prototype.visitInstanceof = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#PrimaryTerm.
	QLParserVisitor.prototype.visitPrimaryTerm = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#If.
	QLParserVisitor.prototype.visitIf = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#MulOperation.
	QLParserVisitor.prototype.visitMulOperation = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#specialId.
	QLParserVisitor.prototype.visitSpecialId = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#quantBody.
	QLParserVisitor.prototype.visitQuantBody = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#quantifier.
	QLParserVisitor.prototype.visitQuantifier = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#ExprArg.
	QLParserVisitor.prototype.visitExprArg = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#DontCare.
	QLParserVisitor.prototype.visitDontCare = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#callArgs.
	QLParserVisitor.prototype.visitCallArgs = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#QualCall.
	QLParserVisitor.prototype.visitQualCall = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#QualCast.
	QLParserVisitor.prototype.visitQualCast = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Agg.
	QLParserVisitor.prototype.visitAgg = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Super.
	QLParserVisitor.prototype.visitSuper = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Lit.
	QLParserVisitor.prototype.visitLit = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Var.
	QLParserVisitor.prototype.visitVar = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#ParExpr.
	QLParserVisitor.prototype.visitParExpr = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#PredicateAtomExpr.
	QLParserVisitor.prototype.visitPredicateAtomExpr = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#Range.
	QLParserVisitor.prototype.visitRange = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#QualifiedExpr.
	QLParserVisitor.prototype.visitQualifiedExpr = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#FullAggBody.
	QLParserVisitor.prototype.visitFullAggBody = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#ExprAggBody.
	QLParserVisitor.prototype.visitExprAggBody = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#IntLit.
	QLParserVisitor.prototype.visitIntLit = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#FloatLit.
	QLParserVisitor.prototype.visitFloatLit = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#BoolLit.
	QLParserVisitor.prototype.visitBoolLit = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#StringLit.
	QLParserVisitor.prototype.visitStringLit = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#bool.
	QLParserVisitor.prototype.visitBool = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#variable.
	QLParserVisitor.prototype.visitVariable = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#compop.
	QLParserVisitor.prototype.visitCompop = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#unop.
	QLParserVisitor.prototype.visitUnop = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#mulop.
	QLParserVisitor.prototype.visitMulop = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#addop.
	QLParserVisitor.prototype.visitAddop = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#closure.
	QLParserVisitor.prototype.visitClosure = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#direction.
	QLParserVisitor.prototype.visitDirection = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#varDecls.
	QLParserVisitor.prototype.visitVarDecls = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#varDecl.
	QLParserVisitor.prototype.visitVarDecl = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#asExprs.
	QLParserVisitor.prototype.visitAsExprs = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#asExpr.
	QLParserVisitor.prototype.visitAsExpr = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#orderBys.
	QLParserVisitor.prototype.visitOrderBys = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#orderBy.
	QLParserVisitor.prototype.visitOrderBy = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#qldoc.
	QLParserVisitor.prototype.visitQldoc = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#QLDocTextSegment.
	QLParserVisitor.prototype.visitQLDocTextSegment = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#simpleId.
	QLParserVisitor.prototype.visitSimpleId = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#literalId.
	QLParserVisitor.prototype.visitLiteralId = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#SimpleAnnotation.
	QLParserVisitor.prototype.visitSimpleAnnotation = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#ArgsAnnotation.
	QLParserVisitor.prototype.visitArgsAnnotation = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#annotName.
	QLParserVisitor.prototype.visitAnnotName = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#annotArg.
	QLParserVisitor.prototype.visitAnnotArg = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#moduleName.
	QLParserVisitor.prototype.visitModuleName = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#qualModuleExpr.
	QLParserVisitor.prototype.visitQualModuleExpr = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#importModuleExpr.
	QLParserVisitor.prototype.visitImportModuleExpr = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#moduleExpr.
	QLParserVisitor.prototype.visitModuleExpr = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#typeLiteral.
	QLParserVisitor.prototype.visitTypeLiteral = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#className.
	QLParserVisitor.prototype.visitClassName = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#dbtype.
	QLParserVisitor.prototype.visitDbtype = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#returnType.
	QLParserVisitor.prototype.visitReturnType = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#typeExpr.
	QLParserVisitor.prototype.visitTypeExpr = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#predicateName.
	QLParserVisitor.prototype.visitPredicateName = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#aritylessPredicateExpr.
	QLParserVisitor.prototype.visitAritylessPredicateExpr = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#predicateExpr.
	QLParserVisitor.prototype.visitPredicateExpr = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#varName.
	QLParserVisitor.prototype.visitVarName = function (ctx) {
	  return this.visitChildren(ctx);
	};

	// Visit a parse tree produced by QLParser#aggId.
	QLParserVisitor.prototype.visitAggId = function (ctx) {
	  return this.visitChildren(ctx);
	};

	exports.QLParserVisitor = QLParserVisitor;

/***/ }
/******/ ]);

console.log(QL.parse("asdf"))
// QL.parse
// ("asdf")