const { Model } = require("mongoose");
const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");
module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({ email, username });
    const registerdUser = await User.register(newUser, password);
    // console.log(registerdUser);
    req.login(registerdUser, (err) => {
      if (err) {
        next(err);
      }
      req.flash("success", "Welcome to Wanderlust");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};
// module.exports.serch = (req, res) => {
//   // console.log(req.body);
//   const data = req.body;
//   res.render("./listings/index.ejs", { data });
// };

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash(
    "success",
    "Welcome to Wanderlust! You have successfully logged in!"
  );
  let redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are successfully logout!");
    res.redirect("/listings");
  });
};

//profile
module.exports.profile = async  (req, res, next) => {  
  
  let userdetails = await User.findById(req.user._id);  //console.log(userdetails);
  let postdetails = await Listing.find({ owner: req.user._id });  let allreviews     = await Review.find({ author: req.user._id });
  //console.log(reviews);  
  let data = {
    username:userdetails.username,    email:userdetails.email,
    total:postdetails.length,    reviews:allreviews.length
  }
    
    res.render("./users/profile.ejs",{data})
  };