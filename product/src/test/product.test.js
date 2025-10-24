const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;
require("dotenv").config();

chai.use(chaiHttp);

// 🌐 Tự động đổi host tùy môi trường (CI = localhost, Local = container name)
const baseUrl = process.env.CI ? "http://localhost:3003" : "http://mc_api_gateway:3003";

describe("Products", () => {
  let authToken;
  let listProduct;

  // ⚙️ before chạy trước tất cả các test
  before(async () => {
    try {
      console.log(`🔗 Connecting to API Gateway at ${baseUrl} ...`);

      // Đăng nhập để lấy token
      const authRes = await chai
        .request(baseUrl)
        .post("/auth/api/v1/login")
        .send({ username: "testuser", password: "123456" });

      if (!authRes || !authRes.body?.token) {
        throw new Error("❌ Không nhận được token khi đăng nhập!");
      }

      authToken = authRes.body.token;
      console.log("✅ Nhận được token đăng nhập!");

      // Thêm 2 sản phẩm mẫu
      await chai
        .request(baseUrl)
        .post("/products/api/v1/add")
        .set("authorization", `Bearer ${authToken}`)
        .send({
          name: "Product 8989",
          price: 100000,
          description: "Description of Product 8989",
        });

      await chai
        .request(baseUrl)
        .post("/products/api/v1/add")
        .set("authorization", `Bearer ${authToken}`)
        .send({
          name: "Product 9898",
          price: 120000,
          description: "Description of Product 9898",
          quantity: 50,
        });

      // Lấy danh sách sản phẩm để đảm bảo route hoạt động
      listProduct = await chai
        .request(baseUrl)
        .get("/products/api/v1")
        .set("authorization", `Bearer ${authToken}`);

      expect(listProduct).to.have.status(200);
      console.log("✅ Kết nối API thành công và lấy danh sách sản phẩm!");
    } catch (err) {
      console.error("❌ Lỗi trong before():", err.message);
      throw err; // ném lỗi để mocha báo thất bại
    }
  });

  after(async () => {
    console.log("🧹 Hoàn tất test Products!");
  });

  // =============================
  // Các bài test chính
  // =============================
  describe("POST /products", () => {
    it("should create a new product", async () => {
      const product = {
        name: "Product 1",
        description: "Description of Product 1",
        price: 10,
        quantity: 100,
      };

      const res = await chai
        .request(baseUrl)
        .post("/products/api/v1/add")
        .set("authorization", `Bearer ${authToken}`)
        .send(product);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property("_id");
      expect(res.body).to.have.property("name", product.name);
      expect(res.body).to.have.property("description", product.description);
      expect(res.body).to.have.property("price", product.price);
      console.log("✅ Tạo sản phẩm thành công!");
    });

    it("should return an error if name is missing", async () => {
      const invalidProduct = { description: "No name", price: 9.99 };

      const res = await chai
        .request(baseUrl)
        .post("/products/api/v1/add")
        .set("authorization", `Bearer ${authToken}`)
        .send(invalidProduct);

      expect(res).to.have.status(400);
      console.log("✅ Bắt lỗi thiếu tên sản phẩm thành công!");
    });
  });
});
  