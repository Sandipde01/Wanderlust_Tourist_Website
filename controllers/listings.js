const Listing = require("../models/listing");
// const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
// const geocodingClient = mbxGeocoding({ accessToken: mapToken });

async function geocodeCity(city) {
  const apiKey = mapToken; // Your OpenCage API key
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
    city
  )}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.results.length > 0) {
      const result = data.results[0];
      const geo = {
        type: "Point",
        coordinates: [result.geometry.lat, result.geometry.lng],
      };

      return geo; // Return the geographic data
    } else {
      throw new alert("City not found");
    }
  } catch (error) {
    return null; // Return null or handle the error appropriately
  }
}

// Index Route
module.exports.index = async (req, res) => {
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
  // console.log(listing);
  res.render("./listings/show.ejs", { listing });
};

// Create Route
module.exports.createListing = async (req, res, next) => {
  let city = req.body.listing.location;
  let geo = await geocodeCity(city);
  if (!geo) {
    req.flash("error", "City not found Please recreate listing!");
    return res.redirect("/listings");
  }
  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = geo; // geocode coordinates save
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
  const id = req.params.id;
  let lisitng = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  //For map update
  let geo = await geocodeCity(req.body.listing.location);
  if (!geo) {
    req.flash("error", "City not found Please reupdate listing!");
    return res.redirect("/listings");
  }
  lisitng.geometry = geo;
  await lisitng.save();

  //for image update
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    lisitng.image = { url, filename };
    await lisitng.save();
  }

  req.flash("success", "Update Listing!");
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

module.exports.tags = async (req, res) => {
  const tags = req.params;
  console.log(tags);
  const allListing = await Listing.find(tags);
  console.log(allListing);
  if (allListing.length > 0) {
    return res.render("./listings/index.ejs", { allListing });
  } else {
    req.flash("error", "Any listing not found from this country name");
    res.redirect("/listings");
  }
};
