import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { Stack } from '@mui/material';

let images = [
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708345.jpg?v=1712571330",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708233.jpg?v=1712571331",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708373.jpg?v=1712571338",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708314.jpg?v=1712571341",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708361.jpg?v=1712571346",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708351.jpg?v=1712571353",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198709817.png?v=1712571378",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708560.jpg?v=1712571375",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198709836.png?v=1712571380",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708846.jpg?v=1712571381",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708578.jpg?v=1712571384",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198706647.jpg?v=1712571319",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198706646.jpg?v=1712571319",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198706639.jpg?v=1712571319",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708197.jpg?v=1712571322",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198706648.jpg?v=1712571320",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708200.jpg?v=1712571322",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198708224.jpg?v=1712571328",
    "https://cdn.shopify.com/s/files/1/0645/2504/1821/files/F198706641.jpg?v=1712571317"
]


export default function ProductCard({ product }) {

  const fallbackImg =
    'https://midwest-takeoffs.myshopify.com/cdn/shop/files/gtpremium_titaniumblack_white_fa2ed835-e6b3-49b4-a7cd-96d4966061b8_460x.jpg?v=1754807673';

  const handleClick = () => {
    window.location.href =  product.url;
  };

  const isOnSale =
    product.sale_price &&
    Number(product.sale_price) < Number(product.price);

  return (
    <div onClick={handleClick}>
      <Card
        elevation={0}
        sx={{
          boxShadow: 0,
          paddingBottom: '0px',
          transition: '0.3s',
          display: 'flex',
          cursor: 'pointer',
          flexDirection: 'column',
          height: '100%',
          '&:hover': {
            transform: 'translateY(-4px)',
            '@media (max-width:900px)': { transform: 'none' },
          },
        }}
      >
        {/* Image with preserved aspect ratio */}
        <Box sx={{ width: '100%', position: 'relative' }}>
          <CardMedia
            component="img"
            image={product.featured_image_url || fallbackImg}
            // image={
            //   images?.[Math.floor(Math.random() * images.length)] || fallbackImg
            // }
            alt={product.title || 'Product'}
            sx={{
              width: '100%',
              // height: "100%",
              padding: '10px',
              aspectRatio: '1 / 1', 
              objectFit: 'contain', // preserves aspect ratio
              // backgroundColor: '#f5f5f5',
            }}
          />

          {isOnSale ? (
            <Chip
              label="Sale"
              // color="#0B33A0"
              // color={'primary'}
              size="small"
              sx={{ color:'white', fontSize:'14px', background:'black',  position: 'absolute', top: 10, left: 10, fontWeight: 'bold' }}
            />
          ): <></>}
        </Box>
          
        {/* Content */}
        <CardContent
          sx={{
            padding: { xs: '8px' },
            paddingLeft: { xs: '8px', md: '15px' },
            paddingTop: '0px',
            paddingBottom: '10px !important',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            gutterBottom
            variant="subtitle1"
            component="div"
            sx={{
              paddingRight: { xs: '8px' },
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: { xs: 'left', md: 'center' },
              lineHeight: 1.3,
              fontSize: '16px',
              color: 'rgb(27, 27, 27)',
            }}
          >
            {product.title}
          </Typography>

          {/* Pricing */}
          {isOnSale ? (
            <Stack direction={'row-reverse'} sx={{justifyContent: {xs: 'left',md: 'center'}, alignItems:'center'}} spacing={1}>
              <Typography
                variant="body2"
                sx={{
                  textAlign: { xs: 'left', md: 'center' },
                  color: '#999',
                  textDecoration: 'line-through',
                  fontSize: '15px',
                }}
              >
                ${product?.price}
                {!product?.price?.toString()?.includes('.') ? '.00' : ''}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  textAlign: { xs: 'left', md: 'center' },
                  color: 'red',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  marginTop: '2px',
                }}
              >
                ${product?.sale_price}
                {!product?.sale_price?.toString()?.includes('.') ? '.00' : ''}
              </Typography>
            </Stack>
          ) : (
            <Typography
              variant="body2"
              sx={{
                textAlign: { xs: 'left', md: 'center' },
                color: 'rgb(27, 27, 27)',
                marginTop: '5px',
                marginBottom: '3px',
                fontWeight: 'bold',
                fontSize: '18px',
              }}
            >
              ${product.price}
              {!product?.price?.toString()?.includes('.') ? '.00' : ''}
            </Typography>
          )}
        </CardContent>
      </Card>
    </div>
  );
}