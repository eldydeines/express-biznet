/** Routes for companies */
const express = require("express");
const ExpressError = require("../expressError");
let slugify = require('slugify');
let router = new express.Router();
//this brings that db object over
const { db } = require("../db");



//Route to returns list of companies, like { companies: [{ code, name }, ...] }
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({ companies: results.rows });
    } catch (e) {
        return next(e);
    }
});


//Return obj of company: {company: {code, name, description}}
//If the company given cannot be found, this should return a 404 status response.
router.get('/:code', async (req, res, next) => {
    try {
        const codeRes = req.params.code;
        const results = await db.query(`SELECT companies.code, companies.name, companies.description, invoices.id, invoices.amt, invoices.paid, invoices.add_date, invoices.paid_date
                                        FROM companies
                                        LEFT JOIN invoices ON invoices.comp_code = companies.code 
                                        WHERE companies.code=$1`, [codeRes]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code: ${codeRes}`, 404)
        }

        let { code, name, description } = results.rows[0];
        let invoices = results.rows.map(r => [r.id, r.amt, r.paid, r.add_date, r.paid_date]);

        const indResults = await db.query(`SELECT i.industry FROM companies AS c 
                                            LEFT JOIN companies_industries AS ci ON c.code=ci.company_code 
                                            LEFT JOIN industries AS i ON i.code = ci.industry_code 
                                            WHERE c.code = $1`, [codeRes]);

        let industries = indResults.rows.map(r => r.industry);
        return res.json({ code, name, description, invoices, industries });
    } catch (e) {
        return next(e);
    }
});


//Adds a company. Needs to be given JSON like: {code, name, description}
//Returns obj of new company: {company: {code, name, description}}
//Fortunately, there’s an NPM library that can help out, slugify. Read about this, 
//and then change the PUT /companies route so that they don’t provide a 
//code directly, but you make this by using slugify() on the given name.
router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const code = slugify(name, { lower: true });
        const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
        return res.status(201).json({ company: results.rows[0] })
    } catch (e) {
        return next(e);
    }
});


//Edit existing company. Should return 404 if company cannot be found.
//Needs to be given JSON like: {name, description}
//Returns update company object: {company: {code, name, description}}
router.put("/:code", async (req, res, next) => {
    try {

        const { name, description } = req.body;
        const code = req.params.code;
        const result = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code = $3 RETURNING code, name, description', [name, description, code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`Can't find company to update with code: ${code}`, 404)
        } else {
            return res.json({ company: result.rows[0] });
        }
    } catch (err) {
        return next(err);
    }

});

//Deletes company. Should return 404 if company cannot be found.
// Returns {status: "deleted"}
router.delete('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const results = await db.query('DELETE FROM companies WHERE code = $1', [code])
        return res.send({ msg: "DELETED!" })
    } catch (e) {
        return next(e)
    }
});


module.exports = router;