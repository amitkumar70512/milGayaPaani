var express = require('express');
var app = express();
var nodemailer = require('nodemailer');

const bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));
app.set("view engine", "ejs");


// database connection using amitdogra.... firebase


var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const { check, validationResult, checkSchema } = require("express-validator");
// for encryption
const bcrypt = require("bcrypt");
const saltRounds = 10;

// mail setup
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'amitkumar.cs19@bmsce.ac.in',
    pass: 'Jammu@123'
  }
});


// current timestamp in milliseconds
let ts = Date.now();

let date_ob = new Date(ts);
let date = date_ob.getDate();
let month = date_ob.getMonth() + 1;
let year = date_ob.getFullYear();

// prints date & time in YYYY-MM-DD format
console.log(year + "-" + month + "-" + date);

let user ='';

app.get("/", function (req, res) {
  const username="amit";
  res.render("pages/index", {
    username:"amit",
  });
});
  app.get("/index", function (req, res) {
    res.render("pages/index", {
      username:user
    });
  });
 
var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})


// for login modal
app.post("/login_page",(req,res)=>{

})

app.post("/login", function (req, res, next) {
  const username = String(req.body.username);
  const password = String(req.body.passkey);

  if(username !='')
  {
  const firestore_con = admin.firestore();
  const writeResult = firestore_con
    .collection("faculty")
    .doc(username)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        // entered uid doesnt registered
        console.log("No such document!");
        const errors = [{ msg: " Failed!  Invalid Crudentials.." }];
        const alert = errors;
        res.render("pages/login", {
          alert
        });
      } else {
        // block for password matching and others
        db_pass = doc.data().password;

        bcrypt.compare(password, db_pass, function (err, result) {
          if (!result) {
            // password mismatch
            console.log("password not matched");
            const errors = [{ msg: "Failed! Invalid crudentials.." }];
            const alert = errors;
            res.render("pages/login", {
              alert,
            });
          } // end of password mismatch
          else {
            // password matched
            fname = doc.data().name;
            console.log("password matched");
            const user = {
              id: uid,
              username: fname,
              password: password,
            };
            const token = generateAccessToken(user);
            console.log("token is created");
            console.log(token);
            res.cookie("1jwt_authentication", token, {
              maxAge: 15 * 24 * 60 * 60 * 1000,
              httpOnly: true,
            });
          
            res.cookie("1user", username, {
              maxAge: 15 * 24 * 60 * 60 * 1000,
              httpOnly: true,
            });
            
           user = username;
          } // end of password matched
        });
      } // end of  block for password matching and others
    }) // end of then

    .catch((err) => {
      console.log("Error getting document", err);
      const errors = [{ msg: "Failed! " + err }];
      const alert = errors;
      res.render("pages/login", {
        alert,
      });
    }); // end of catch

  }
});


// for register
app.post(
  "/register",
  [
    check("name", "Please enter valid username without space..")
      .exists()
      .isLength({ min: 3 })
      .matches(/^[a-zA-Z]+(\s[a-zA-Z]+)?$/),
    check("email", "Please provide valid email")
      .isEmail()
      .normalizeEmail(),
    check(
      "passkey",
      " password must have  at least one  number,capital letter and minumum length 5. "
    )
      .isLength({ min: 5 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,20}$/),
    check("confirmpasskey", "Passwords do not match").custom(
      (value, { req }) => value === req.body.passkey
    ),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const username = user;
    const encryptkey = await bcrypt.hash(req.body.passkey, saltRounds);
    if (!errors.isEmpty()) {
      // return res.status(422).jsonp(errors.array())
      const alert = errors.array();
      res.render("pages/index", {
        alert
      });
    } else {
      // if no errors continue
      const firestore_con = admin.firestore();
      const write = firestore_con
      .collection("users")
      .doc(req.body.email)
      .get()
      .then((doc) => {
        if (doc.exists) {
          // entered email already linked 
          console.log("user already exists!");
          const errors = [{ msg: `Failed!  ${req.body.email} is already linked to another account`}];
          const alert = errors;
          res.render("pages/index",{
            alert
          });
          
        } else{
    // user is new
     console.log("user is new");
      let ts = Date.now();
      let date_ob = new Date(ts);
      let date = date_ob.getDate();
      let month = date_ob.getMonth() + 1;
      let year = date_ob.getFullYear();
      let created = year + "-" + month + "-" + date;
        // prints date & time in YYYY-MM-DD format
        console.log(year + "-" + month + "-" + date);

      console.log(req.body.name);
      console.log(req.body.email);
      console.log(req.body.passkey);

      
      const writeResult =  admin
        .firestore()
        .collection("users")
        .doc(req.body.email)
        .set({
          name: req.body.name,
          created:created,
          password: encryptkey,
        })
        .then(function () {
          user = req.body.email;
          console.log("Document successfully written!");
          var mailOptions = {
            from: 'amitkumar.cs19@bmsce.ac.in',
            to: 'tk94694@gmail.com',
            subject: 'MilGayaPaani!! Sending Email using Node.js',
            html: '<h1>Thanks for subscribing to MilGaya!!'
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
          const toast_message={name:`Howraahh ${req.body.name}`,message:" Ab Milega Paani !"};
          
          res.render("pages/index",{
            toast_message,username
          });
        })
        .catch(function (error) {
          console.error("Error writing document: ", error);
          // Already exist
          console.log("error in inserting");
          const errors = [{ msg: "Request Denied !! Unable to register..." }];
          const alert = errors;
          res.render("pages/index", {
            alert
          });
        });
        }
      }) // end of then
      
      .catch((err) => {
        console.log("Error getting document", err);
        const errors = [{ msg: "Failed! " + err }];
        const alert = errors;
        res.render("pages/index", {
          alert,username
        });
      }); // end of catch

    }
  }
);

/// for accessing feedbacks (using ajax)

app.get("/get_feedback", async (req, res) => {
  const feed = await admin.firestore().collection("feedback").get();
  feedbacks = feed.docs.map((doc) => doc.data());
  lenfeed = Object.keys(feedbacks).length;
  var i, feed_data;
  feed_data =
    '<div class="form-outline"><label class="form-label" for="textAreaExample">Queries :</label><table class="table "data-aos="fade-up" date-aos-delay="300"><thead><tr><th scope="col">\'\'</th><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Subject</th><th scope="col">Message</th></tr></thead><tbody>';
  for (i = 0; i < lenfeed; i++) {
    feed_data +=
      '<tr><th scope="row">' +
      (i + 1) +
      "</th><td>" +
      feedbacks[i].name +
      "</td><td>" +
      feedbacks[i].email +
      " </td><td>" +
      feedbacks[i].subject +
      "</td><td>" +
      feedbacks[i].message +
      '</td> <td><button type="button" class="btn btn-danger" style="text-align:center";>delete</button></td></tr>';
  }
  feed_data +=
    '</tbody></table><button type="button" onclick="close_feed()"  class="btn btn-danger" style="text-align: center;" >Close</button></div>';
  res.send(feed_data);
});


// handling get requests for anonymous

app.get("/:id", function (req, res) {
  res.render(`pages/${req.params.id}`);
});