const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../app/server");

const should = chai.should();
chai.use(chaiHttp);

let loginToken = null;

const authenticate = async (
  username = "yellowleopard753",
  password = "jonjon"
) => {
  try {
    const res = await chai
      .request(server)
      .post("/api/login")
      .send({ username, password });
    if (!res.body.token) {
      throw new Error("Authentication succeeded but no token was returned");
    }
    return res.body.token;
  } catch (err) {
    console.error(`Authentication failed for user ${username}:`, err.message);
    throw err;
  }
};

before(async function () {
  try {
    loginToken = await authenticate();
    console.log("Authentication successful");
  } catch (err) {
    console.error("Test setup failed during authentication step");
    throw err;
  }
});

describe("Brands", () => {
  describe("GET /api/brands endpoint", () => {
    it("returns a 200 status and all brands with IDs and names", async () => {
      const res = await chai.request(server).get("/api/brands");
      res.should.have.status(200);
      res.body.should.be.a("array");
      res.body.should.not.be.empty;
      if (res.body.length > 0) {
        res.body[0].should.have.property("id");
        res.body[0].should.have.property("name");
      }
    });
  });
});

describe("Login", () => {
  describe("User authentication (POST /api/login)", () => {
    it("authenticates valid users and returns a token", async () => {
      const validCredentials = {
        username: "yellowleopard753",
        password: "jonjon",
      };
      const res = await chai
        .request(server)
        .post("/api/login")
        .send(validCredentials);
      res.should.have.status(200);
      res.body.should.be.an("object");
      res.body.should.have.property("token");
      res.body.token.should.be.a("string");
      res.body.token.should.not.be.empty;
    });
    it("rejects invalid credentials with 401 Unauthorized", async () => {
      const invalidCredentials = {
        username: "wronguser",
        password: "wrongpass",
      };
      const res = await chai
        .request(server)
        .post("/api/login")
        .send(invalidCredentials);
      res.should.have.status(401);
      res.body.should.have
        .property("error")
        .that.includes("Invalid credentials");
    });
  });
});

describe("Cart", () => {
  describe("Shopping cart management", () => {
    describe("Authentication requirements", () => {
      it("rejects cart access when user is not authenticated", async () => {
        const res = await chai.request(server).get("/api/me/cart");
        res.should.have.status(401);
      });
      it("allows cart access for authenticated users", async () => {
        const res = await chai
          .request(server)
          .get("/api/me/cart")
          .set("Authorization", `Bearer ${loginToken}`);
        res.should.have.status(200);
      });
    });
    describe("Adding products (POST /api/me/cart)", () => {
      it("adds a product to the user's cart", async () => {
        const productToAdd = { productId: "1", quantity: 2 };
        const res = await chai
          .request(server)
          .post("/api/me/cart")
          .set("Authorization", `Bearer ${loginToken}`)
          .send(productToAdd);
        res.should.have.status(200);
        res.body.should.be.an("object");
        res.body.should.have.property("user");
        res.body.user.should.have.property("cart").that.is.an("array");
        res.body.user.cart[0].productId.should.equal("1");
        res.body.user.cart[0].quantity.should.equal(2);
      });
      it("returns 404 when adding a non-existent product", async () => {
        const nonExistentProduct = { productId: "100", quantity: 2 };
        const res = await chai
          .request(server)
          .post("/api/me/cart")
          .set("Authorization", `Bearer ${loginToken}`)
          .send(nonExistentProduct);
        res.should.have.status(404);
      });
    });
    describe("Updating product quantities (POST /api/me/cart/:productId)", () => {
      it("updates the quantity of an existing cart item", async () => {
        const updatedQuantity = { quantity: 2 };

        const res = await chai
          .request(server)
          .post("/api/me/cart/1")
          .set("Authorization", `Bearer ${loginToken}`)
          .send(updatedQuantity);

        res.should.have.status(200);
        res.body.user.cart[0].productId.should.equal("1");
        res.body.user.cart[0].quantity.should.equal(2);
      });
    });
    describe("Removing products (DELETE /api/me/cart/:productId)", () => {
      it("rejects product removal when user is not authenticated", async () => {
        const res = await chai.request(server).delete("/api/me/cart/1");
        res.should.have.status(401);
      });
      it("successfully removes a product from the cart", async () => {
        const res = await chai
          .request(server)
          .delete("/api/me/cart/1")
          .set("Authorization", `Bearer ${loginToken}`);
        res.should.have.status(200);
      });
    });
  });
});
