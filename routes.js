"use strict";

/** Routes for Lunchly */

const express = require("express");
const { NotFoundError } = require("./expressError");

const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
  const customers = await Customer.all();
  return res.render("customer_list.html", { customers });
});

/** Search for a customer by first and last name, renders search results page */

router.get('/search', async function (req, res, next) {
    const terms = req.query.search;
    if (!terms) {
      throw new NotFoundError(
        `Please type customer first name and last name to search!`);
    }
  
    const customerSearchResults = await Customer.search(terms);
    if(!customerSearchResults) {
      throw new NotFoundError(`Couldn't find matched customers according the given
      first name and last name!`);
    }
    
    return res.render("customer_search.html", { customerSearchResults });
  });

/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
  return res.render("customer_new_form.html");
});

/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
  const { firstName, lastName, phone, notes } = req.body;
  const customer = new Customer({ firstName, lastName, phone, notes });
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Show top ten customers that make the most reservations. */
router.get('/top-ten/', async function (req, res, next) {
  const topTenCustomers = await Customer.showTopTenCustomers();
  return res.render("top_ten_customers.html", { topTenCustomers });
})

/** Show a customer, given their ID. */

router.get("/:id/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);
 
  const reservations = await customer.getReservations();

  return res.render("customer_detail.html", { customer, reservations });
});

/** Show form to edit a customer. */

router.get("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  res.render("customer_edit_form.html", { customer });
});

/** Handle editing a customer. */

router.post("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);
  customer.firstName = req.body.firstName;
  customer.lastName = req.body.lastName;
  customer.phone = req.body.phone;
  customer.notes = req.body.notes;
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
  const customerId = req.params.id;
  
  const startAt = new Date(req.body.startAt);
  const numGuests = req.body.numGuests;
  const notes = req.body.notes;

  const reservation = new Reservation({
    customerId,
    startAt,
    numGuests,
    notes,
  });
  await reservation.save();

  return res.redirect(`/${customerId}/`);
});


module.exports = router;
