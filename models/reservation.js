"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");
const Customer = require("./customer");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** show top 10 customers with the most reservations */

  static async showTopTenCustomers() {
    const topTenCustomers = await db.query(
      `SELECT R.customer_id, COUNT(R.id) AS reservationCount
      FROM reservations AS R
      JOIN customers AS C 
      ON R.customer_id = C.id
      GROUP BY R.customer_id
      ORDER BY reservationCount DESC
      LIMIT 10`
    );

    const customerIds = topTenCustomers.rows.map(c => c.customer_id);

    return customerIds.rows.map(id => new Customer.get(id));
  }

  /** save this reservation */

  async save() {
    //check the reservation table for the customer's ID
    //if there, edit the reservation
    //if not, create the reservation 
    if (this.id === undefined) {
      const results = await db.query(
        `INSERT INTO reservations (
                      customer_id, 
                      num_guests, 
                      start_at, 
                      notes)
          VALUES($1, $2, $3, $4)
          RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes]
      )
      const reservation = results.rows[0];

      this.id = results.rows[0].id;

    } else {
      const results = await db.query(
        `UPDATE reservations
          SET num_guests = $1,
                start_at = $2,
                notes = $3
          WHERE id = $4`,
        [this.numGuests, this.startAt, this.notes, this.id]
      )
    }

  }
}


module.exports = Reservation;
