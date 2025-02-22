// criptografar a senha "!@#$%¨&*(" e mostrar a senha criptografada
const bcrypt = require('bcryptjs');

const saltRounds = 10;
const password = "!@#$%¨&*(";

bcrypt.hash(password, saltRounds, function (err, hash) {
    console.log(hash);
});
