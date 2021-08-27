/** Routes for industries */
const express = require("express");
const ExpressError = require("../expressError")
let router = new express.Router();
//this brings that db object over
const { db } = require("../db");

//route for adding an industry
router.post('/', async (req, res, next) => {
    try {
        const { industry, code } = req.body;
        const results = await db.query('INSERT INTO industries (industry, code) VALUES ($1, $2) RETURNING industry, code', [industry, code]);
        return res.status(201).json({ industry: results.rows[0] })
    } catch (e) {
        return next(e);
    }
});

//route for listing all industries, which should show the company code(s) for that industry
router.get('/', async (req, res, next) => {
    try {

        const results = await db.query(`SELECT i.industry, c.name
                                        FROM industries as i
                                        LEFT JOIN companies_industries AS ci
                                        ON i.code = ci.industry_code
                                        LEFT JOIN companies AS c
                                        ON c.code=ci.company_code
                                        GROUP BY i.industry, c.name`);
        if (results.rows.length === 0) {
            throw new ExpressError(`No industries`, 404)
        }
        let industries = results.rows;
        return res.json({ industries });
    } catch (e) {
        return next(e);
    }
});

//route for associating an industry to a company
router.post('/:code', async (req, res, next) => {
    try {
        const { company } = req.body;
        const results = await db.query('INSERT INTO companies_industries (industry_code, company_code) VALUES ($1, $2) RETURNING industry_code, company_code', [req.params.code, company]);
        return res.status(201).json({ industry: results.rows[0] })
    } catch (e) {
        return next(e);
    }
});

module.exports = router;
