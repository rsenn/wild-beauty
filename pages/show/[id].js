export default (props,res) => {

const { initialMobxState, router, className } = props;
const { query } = router;

console.log(`Post: req:`, query);
// res.end(`Post: req:`, query.id);

  return <div><h4>Id: {query.id}</h4>
  </div>
};
