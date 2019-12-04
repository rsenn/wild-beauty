var chai = require("chai"),
    expect = chai.expect,
    sql = require("../psql");

describe("select", function() {
  it("should generate a select statement with an asterisk with no arguments", function() {
    expect(sql.select().from("users").toQuery().text).to.equal("select * from users");
  });

  it("should generate a select statement with a single column name", function() {
    expect(sql.select("id").from("users").toQuery().text).to.equal("select id from users");
  });

  it("should generate a select statement with column names", function() {
    expect(sql.select("id", "email").from("users").toQuery().text).to.equal("select id, email from users");
  });

  it('should handle json columns', function() {
    expect(sql.select('id', "data->>'name' as name").from('users').toQuery().text).to.equal("select id, data->>'name' as name from users")
  });

  //SELECT id, data->'author'->>'first_name' as author_first_name FROM books;
  it('should handle json column nesting', function() {
    expect(sql.select('id', "data->'author'->>'first_name' as author_first_name").from('books').toQuery().text)
    .to.equal("select id, data->'author'->>'first_name' as author_first_name from books")
  });
});
