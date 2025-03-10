const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
const app = express();

app.use(bodyParser.json());

// Importing the data from JSON files
const users = require("../initial-data/users.json");
const brands = require("../initial-data/brands.json");
const products = require("../initial-data/products.json");

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// create endpoint for /brands
app.get("/brands", (req, res) => {
  res.json(brands);
});

// create endpoint /brands/{id}/products
// create endpoint /products
// create endpoint /login
// create enpoint for /me/cart
// /me/cart/{productId}

// Starting the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
