var chai = require("chai"),
    expect = chai.expect,
    sql = require("../psql");

describe("offset", function() {
  it("should generate the correct sql statement", function() {
    expect(sql.select().from("users").limit(10).offset(5).toQuery())
      .to.deep.equal({ text: "select * from users limit 10 offset 5", values: [] });
  });

  it("should throw an error if a non-integer is passed", function() {
    expect(function () { sql.offset("x"); }).to.throw("Argument should be an integer");
  });
});
