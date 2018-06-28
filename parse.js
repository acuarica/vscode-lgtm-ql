
const fs = require('fs-extra');
const qltext = fs.readFileSync("test.ql").toString()
console.log(qltext)

var comments = require('parse-comments');
var res = comments(qltext);
console.log(res);

// LineComment

const P = require('parsimmon')

const QLParser = P.createLanguage({
    LineComment: function (r) {
        return P
            .string('//')
            .then(P.regexp(/.*/))
            .skip(P.end)
            .trim(P.optWhitespace)
            .map(x => {
                return { lineComment: x };
            });
    },
    Query: function (r) {
        return r.LineComment.many().then(r.Import)
    },
    // Q: function (r, p) {
    //     return r.Comment.many().then(p)
    // },
    Import: function (r) {
        return P
            .string('import').trim(P.optWhitespace)
            .then(r.Symbol)
    },
    // Value: function (r) {
    //     return P.alt(
    //         r.Number,
    //         r.Symbol,
    //         r.List
    //     );
    // },
    // Number: function () {
    //     return P.regexp(/[0-9]+/).map(Number);
    // },
    Symbol: function () {
        return P.regexp(/[a-z]+/);
    },
    // List: function (r) {
    //     return P.string('(')
    //         .then(r.Value.sepBy(r._))
    //         .skip(P.string(')'));
    // },
    // _: function () {
    //     return P.optWhitespace;
    // }
});


// const fs = require('fs-extra');
// const qltext = fs.readFileSync("test.ql").toString()
// console.log(qltext)

// var res = Lang.Value.tryParse('(list 1 2 foo (list nice 3 56 989 asdasdas))');
// var res = QLParser.Query.tryParse(qltext);
// console.log(res);

// console.log(QLParser.Query.tryParse(`
// //    hhola ola asdf

// // another line comment after newline

// //maybe another

// import java

// // asdf

// select "Holaa"
// `));
