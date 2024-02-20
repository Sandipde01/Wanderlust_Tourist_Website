const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Index Route
module.exports.index = async (req, res) => {
  console.log(req.body.value);
  const allListings = await Listing.find({});
  if (req.body.value) {
    let c = req.body.value;
    let allListing = allListings.filter((e) => {
      return e.country.toLowerCase().includes(c.toLowerCase());
    });
    res.render("./listings/index.ejs", { allListing });
  } else {
    const allListing = await Listing.find({});
    res.render("./listings/index.ejs", { allListing });
  }
};

// New Route
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// Show Route
module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  console.log(listing);
  res.render("./listings/show.ejs", { listing });
};

// Create Route
module.exports.createListing = async (req, res, next) => {
  // let {title,description,image,price,country,location}=req.body;

  // let listing=req.body.listing;
  console.log("ok");
  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 2,
    })
    .send();
  console.log(req.body.value);
  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = response.body.features[0].geometry;
  let save = await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

// Edit Route

module.exports.renderEditFrom = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_200,w_250");
  res.render("./listings/edit.ejs", { listing, originalImageUrl });
};

// Update Listing

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", " Listing Updated!");
  res.redirect(`/listings/${id}`);
};

//   Delete Route

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  // console.log(deletedListing);
  req.flash("success", " Listing Deleted!");
  res.redirect("/listings");
};
