"use strict";

/** Customer for Lunchly */

const db = require("../db");
const { NotFoundError } = require("../expressError");


/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** search all customers according the search terms */
  static async search(terms) {
    const searchResults = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              notes
        FROM customers
        WHERE concat(first_name, ' ', last_name) ILIKE $1
        ORDER BY last_name, first_name`, [`%${terms}%`]
    );

    return searchResults.rows.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    const Reservation = require("./reservation");
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** show top 10 customers with the most reservations */
    //move to customer model, about customers (when we query customer data, easier to hand back customer instances)
  static async showTopTenCustomers() {
    const topTenCustomers = await db.query(
      `SELECT R.customer_id, 
              C.id,
              C.first_name AS "firstName",
              C.last_name  AS "lastName",
              C.phone,
              C.notes,
              COUNT(*) as reservationCount
      FROM reservations AS R
      JOIN customers AS C 
      ON R.customer_id = C.id
      GROUP BY C.id, R.customer_id
      ORDER BY reservationCount DESC
      LIMIT 10`
    );

    const topTen = topTenCustomers.rows.map(c => new Customer(c));
    //it knows which values to instatiate Customers with bc of obj destructuring--the keys of the topTenCustomers objs map to the required args to instatiate a Customer

    return topTen;
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }

  /** return a customer's full name */

  fullName() {  
    return (`${this.firstName} ${this.lastName}`);
  }

}
















module.exports = Customer;
