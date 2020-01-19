export default (props, res) => {
  const { initialMobxState, router, className } = props;
  const { query } = router;

  console.log(`/edit/${query.id}`, query);
  // res.end(`Post: req:`, query.id);

  return (
    <div>
      <h4>/edit/{query.id}</h4>
    </div>
  );
};
