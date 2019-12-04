var chai = require("chai"),
    expect = chai.expect,
    sql = require("../psql");

describe("limit", function() {
  it("should generate the correct sql statement", function() {
    expect(sql.select().from("users").limit(10).toQuery())
      .to.deep.equal({ text: "select * from users limit 10", values: [] });
  });

  it("should throw an error if a non-integer is passed", function() {
    expect(function () { sql.limit("x"); }).to.throw("Argument should be an integer");
  });
});
