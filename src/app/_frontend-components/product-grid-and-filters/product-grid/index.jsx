import { Grid } from "@mui/material";
import ProductCard from "./product_item";

export default function ProductGrid({products}){
    return(
        <div  >
            <Grid container spacing={{xs:1, md:2.4}} alignItems={'stretch'}>
                {
                    products.map((product, index) => (
                        <Grid key={index} item size={{ xs: 6, md: 3 }} sx={{
                                      borderRight: {xs:'1px solid rgba(0, 0,0,0.05)', md:'none'},
          borderBottom: {xs:'1px solid rgba(0, 0,0,0.05)', md:'none'},
                            boxShadow:0, background:'white'}} >
                            <ProductCard  product={product} key={index} />
                        </Grid>
                    ))
                }
                
            </Grid>
        </div>

    )
}