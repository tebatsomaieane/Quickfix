const express = require("express");
const router = express.Router();

const {
    getAll,
    getById
} = require("../controllers/productController");

// Catalogue browsing is public - matches categories and services.
router.get("/", getAll);
router.get("/:id", getById);

module.exports = router;