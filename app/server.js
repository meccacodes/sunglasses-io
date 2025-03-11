const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
const app = express();

app.use(bodyParser.json());

const users = require("../initial-data/users.json");
const brands = require("../initial-data/brands.json");
const products = require("../initial-data/products.json");

const JWT_SECRET = "your-secret-key";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const foundUser = users.find((u) => u.login.username === user.username);
    if (!foundUser) {
      return res.status(403).json({ error: "User not found" });
    }

    req.user = foundUser;
    next();
  });
};

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/api/brands", (req, res) => {
  res.status(200).json(brands);
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (user) =>
      user.login.username === username && user.login.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ username: user.login.username }, JWT_SECRET, {
    expiresIn: "1h",
  });

  res.status(200).json({ token });
});

app.get("/api/me/cart", authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

app.post("/api/me/cart", authenticateToken, (req, res) => {
  const { productId, quantity } = req.body;

  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const userIndex = users.findIndex(
    (u) => u.login.username === req.user.login.username
  );

  const cartItemIndex = users[userIndex].cart.findIndex(
    (item) => item.productId === productId
  );

  if (cartItemIndex >= 0) {
    users[userIndex].cart[cartItemIndex].quantity = quantity;
  } else {
    users[userIndex].cart.push({ productId, quantity });
  }

  res.status(200).json({ user: users[userIndex] });
});

app.post("/api/me/cart/:productId", authenticateToken, (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const userIndex = users.findIndex(
    (u) => u.login.username === req.user.login.username
  );

  const cartItemIndex = users[userIndex].cart.findIndex(
    (item) => item.productId === productId
  );

  if (cartItemIndex >= 0) {
    users[userIndex].cart[cartItemIndex].quantity = quantity;
    res.status(200).json({ user: users[userIndex] });
  } else {
    res.status(404).json({ error: "Product not found in cart" });
  }
});

app.delete("/api/me/cart/:productId", authenticateToken, (req, res) => {
  const { productId } = req.params;

  const userIndex = users.findIndex(
    (u) => u.login.username === req.user.login.username
  );

  users[userIndex].cart = users[userIndex].cart.filter(
    (item) => item.productId !== productId
  );

  res.status(200).json({ user: users[userIndex] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
