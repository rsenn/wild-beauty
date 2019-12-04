function psql() {
  this.text = null;
  this.values = [];
}

psql.prototype.select = function() {
  this.text = "select ";
  this.values = [];

  if(arguments.length === 0) {
    this.text += "*";
  } else {
    this.text += Array.prototype.slice.call(arguments).join(", ");
  }

  return this;
};

psql.prototype.from = function(table) {
  this.text = this.text + " from " + table;
  this.values = [];
  return this;
};

psql.prototype.insert = function(table, args) {
  var columns = Object.keys(args);
  this.values = columns.map(function(k) { return args[k]; });

  var placeholders = [];

  for (var i = 0; i !== this.values.length; i++) {
    placeholders.push("$" + (i + 1));
  }

  this.text = "insert into " + table + " (" + columns.join(", ") + ") values (" + placeholders.join(", ") + ")";

  return this;
};

psql.prototype.where = function() {
  // check for existing $x values
  // start at $(x + 1)
  var where = [].shift.apply(arguments);

  var startIndex = (this.text.match(/\$\d+/g) || []).length;
  var whereWithShiftedPlaceholders = where.replace(/\$\d+/g, function() { return "$" + (++startIndex); });

  this.text += " where " + whereWithShiftedPlaceholders;

  var values = Array.prototype.slice.call(arguments);

  if(this.values) {
    this.values = this.values.concat(values);
  } else {
    this.values = values;
  }

  return this;
};

psql.prototype.update = function(table, args) {
  var columns = Object.keys(args);
  this.values = columns.map(function(k) { return args[k]; });

  var placeholders = [];

  for(var i = 0; i !== this.values.length; i++) {
    placeholders.push(columns[i] + " = $" + (i + 1));
  }

  this.text = "update " + table + " set " + placeholders.join(", ");

  return this;
};

psql.prototype.delete = function(table) {
  this.text = "delete from " + table;
  this.values = [];
  return this;
};

psql.prototype.returning = function() {
  if(arguments.length === 0) {
    this.text += " returning *";
  } else {
    var columns = Array.prototype.slice.call(arguments);
    this.text += " returning " + columns.join(", ");
  }

  return this;
};

psql.prototype.limit = function(limit) {
  if(limit !== +limit || limit !== (limit | 0)) {
    throw new Error("Argument should be an integer");
  }

  this.text += " limit " + limit;

  return this;
};

psql.prototype.offset = function (offset) {
  if(offset !== +offset || offset !== (offset | 0)) {
    throw new Error("Argument should be an integer");
  }

  this.text += " offset " + offset;

  return this;
};

psql.prototype.order = function () {
  if(arguments.length === 0) {
    throw new Error("Order requires at least one argument");
  }

  var columns = Array.prototype.slice.call(arguments);

  this.text += " order by " + columns.join(", ");

  return this;
};

psql.prototype.toQuery = function() {
  return {
    text: this.text,
    values: this.values
  };
};

module.exports = new psql();
