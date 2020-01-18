import React from "react";
import Util from "../../utils/util.js";


export const Grid = ({ rows, cols }) => <React.Fragment>
<div className={'grid-view'} style={{ gridTemplateRows: Util.repeat(rows, ' '+(100/ rows.length)+'%') }}  >
</div>
<style>{`
.grid-view {
  display: grid;

}
  `}</style>
</React.Fragment>
