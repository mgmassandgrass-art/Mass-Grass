import React from 'react';
import {Composition} from 'remotion';
import {Turn} from './Turn';
export const Root=()=>(<>
  <Composition id="Turn" component={Turn} durationInFrames={48} fps={30} width={1440} height={810} defaultProps={{from:'c27-00',to:'c27-05'}}/>
  <Composition id="TurnM" component={Turn} durationInFrames={48} fps={30} width={720} height={1152} defaultProps={{from:'c27-00',to:'c27-05',crop:{x:830,y:0,w:900,h:1440},outW:720}}/>
</>);
