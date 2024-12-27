import Grid from "@mui/material/Grid";

import solIcon from "../assets/SOLIcon.png";
import tgIcon from "../assets/TGIcon.png";
import twIcon from "../assets/TWIcon.png";
import dcIcon from "../assets/DCIcon.png";

export default function Footer() {
  return (
    <Grid container justifyContent="center" spacing={2} marginTop={4}>
      <Grid item>
        <a href="https://twitter.com/Porgyonsol" target="__blank">
          <img src={twIcon} alt="" width={48} height={48} />
        </a>
      </Grid>
      <Grid item>
        <a href="https://t.me/porgyonsol  " target="__blank">
          <img src={tgIcon} alt="" width={48} height={48} />
        </a>
      </Grid>
      <Grid item>
        <a href="https://discord.gg/5S4zSZgqKz" target="__blank">
          <img src={dcIcon} alt="" width={48} height={48} />
        </a>
      </Grid>
    </Grid>
  );
}
