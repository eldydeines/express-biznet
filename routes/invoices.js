/** Routes for invoices */
const express = require("express");
const ExpressError = require("../expressError")
let router = new express.Router();
//this brings that db object over
const { db } = require("../db");

//Route to returns info on invoices: like {invoices: [{id, comp_code}, ...]}
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query("SELECT * FROM invoices");
        return res.json({ invoices: results.rows });
    } catch (e) {
        return next(e);
    }
});


//Returns obj on given invoice.  If invoice cannot be found, returns 404.
//Returns {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(`SELECT invoices.id, invoices.amt, invoices.paid, invoices.add_date, invoices.paid_date, companies.code, companies.name, companies.description 
                                        FROM invoices 
                                        INNER JOIN companies ON invoices.comp_code = companies.code
                                        WHERE invoices.id=$1`, [id]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find invoice with id: ${id}`, 404)
        }
        return res.json({ invoices: results.rows });
    } catch (e) {
        return next(e);
    }
});

//Adds an invoice. Needs to be passed in JSON body of: {comp_code, amt}
//Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date', [comp_code, amt]);
        return res.status(201).json({ invoices: results.rows[0] })
    } catch (e) {
        return next(e);
    }
});

//Updates an invoice. If invoice cannot be found, returns a 404.
//Needs to be passed in a JSON body of {amt}
//Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put("/:id", async (req, res, next) => {
    try {
        const id = req.params.id;
        const { amt } = req.body;
        const result = await db.query('UPDATE invoices SET amt=$1 WHERE id = $2 RETURNING id, comp_code, amt, paid, add_date, paid_date', [amt, id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find invoice to update with id: ${id}`, 404)
        } else {
            return res.json({ company: result.rows[0] });
        }
    } catch (err) {
        return next(err);
    }

});


//Deletes an invoice. If invoice cannot be found, returns a 404.
//Returns: {status: "deleted"}
router.delete('/:id', async (req, res, next) => {
    try {
        const id = req.params.id;
        const results = await db.query('DELETE FROM invoices WHERE id = $1', [id])
        return res.send({ status: "deleted" })
    } catch (e) {
        return next(e)
    }
});

module.exports = router;