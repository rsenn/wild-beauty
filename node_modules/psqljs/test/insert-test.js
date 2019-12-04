var chai = require("chai"),
    expect = chai.expect,
    sql = require("../psql");

describe("insert", function() {
  it("should generate an insert statement", function() {
    expect(sql.insert("users", { firstName: "Johnny", lastName: "Appleseed" }).toQuery())
      .to.deep.equal({text: "insert into users (firstName, lastName) values ($1, $2)", values: ["Johnny", "Appleseed"]});
  });

  it("should generate a returning statement", function() {
    expect(sql.insert("users", { firstName: "Johnny", lastName: "Appleseed" }).returning().toQuery())
      .to.deep.equal({text: "insert into users (firstName, lastName) values ($1, $2) returning *", values: ["Johnny", "Appleseed"]});
  });

  it("should generate a returning statement with columns", function() {
    expect(sql.insert("users", { firstName: "Johnny", lastName: "Appleseed" }).returning("firstName", "lastName").toQuery())
      .to.deep.equal({text: "insert into users (firstName, lastName) values ($1, $2) returning firstName, lastName", values: ["Johnny", "Appleseed"]});
  });
});
