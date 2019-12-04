var chai = require("chai"),
    expect = chai.expect,
    sql = require("../psql");

describe("delete", function() {
  it("should generate the correct sql statement", function() {
    expect(sql.delete("users").where("firstName = $1", "Johnny").toQuery())
      .to.deep.equal({text: "delete from users where firstName = $1", values: ["Johnny"]});
  });
});
