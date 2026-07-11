'use client'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useEffect, useState } from "react"
import { Alert, Box, Chip, Container, Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import { useCallback } from "react";
import toast from 'react-hot-toast'
import ProductGrid from "./product-grid";
import PaginationWithMUI from "./pagination";
import ProductFilters from "./product-filters";
import LoadingSpinner from "../loading-spinner";
import CustomButton from "../custom-button";
const Button = CustomButton; // rename locally
import SortBy from "./sort--by";
import { generateLabelUnit } from "../label-unit";
import FilterDrawer from "./filter-drawer-mobile";
import YMMwidget from '../ymm-widget';


export function scrollToElementTopById(id, offset = 0) {
    

    // if not already aligned, force it
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    

}

function buildCategoryTree(categories) {
  const visible = categories.filter(cat => cat.is_visible);
  const map = {};
  const roots = [];

  // Initialize map
  visible.forEach(cat => {
    map[cat.id] = { ...cat, children: [] };
  });

  // Build tree
  visible.forEach(cat => {
    if (cat.bigcommerce_parent_id === 0) {
      roots.push(map[cat.id]);
    } else if (map[cat.bigcommerce_parent_id]) {
      map[cat.bigcommerce_parent_id].children.push(map[cat.id]);
    }
  });

  return roots;
}



export default function ProductGridAndFilters({endpoint = `http://localhost:3000`, collectionID = '', searchQuery = '', disableYMM = false, presetAttributes = [] }){

    console.log("Calling loadProductGridAndFilters from inside the main functionnnnnnnnnnn");

    const [productsAndFilters, setProductsAndFilters] = useState(null);
    const [selectedFilters, setSelectedFilters] = useState(
        {
            page:1, 
            useSelectedVehicle: !disableYMM, 
            sort_by: '', 
            price: {},  
            attributes:  Array.isArray(presetAttributes)
                            ? presetAttributes.filter(attr =>
                                attr &&
                                typeof attr === "object" &&
                                typeof attr.key === "string" &&
                                typeof attr.label === "string" &&
                                Array.isArray(attr.values) &&
                                attr.values.length > 0 &&
                                attr.values.every(v => typeof v === "string" && v.trim())
                                )
                            : [], 
            query: searchQuery
        }
    )
    const [isLoading, setIsLoading] = useState(false)
    const [categoriesFlat, setCategoriesFlat] = useState([])

    const [fullCategoryTree, setFullCategoryTree] = useState([])

    const [selectedVehicle, setSelectedVehicle] = useState(null)

    const [displayYMMwidget, setDisplayYMMwidget]= useState(false)
    const [hasVehicleBeenSelected, setHasVehicleBeenSelected] = useState(false)

    // commenting below because we need to use usecallback not sure why 
    // const handleQuery = (query) => {
    //     setSelectedFilters(prev => ({
    //       ...prev,
    //       page: 1,
    //       query:query
    //     }));
    // }

    const handleQuery = useCallback((query) => {
        setSelectedFilters(prev => ({
            ...prev,
            page: 1,
            query: query
        }));
    }, []);


    const fetchProductsWithoutVehicleContextAndQuery = () => {
        
        setSelectedFilters(prev => ({
            ...prev,
            page: 1,
            query: '',
            useSelectedVehicle: false, 
        }));

    }
   
    const fetchProductsWithoutVehicleContext = () => {
        
        setSelectedFilters(prev => ({
            ...prev,
            page: 1,
            useSelectedVehicle: false, 
        }));

    }

    const fetchProductsWithVehicleContext = () => {
        
        setSelectedFilters(prev => ({
            ...prev,
            page: 1,
            useSelectedVehicle: true, 
        }));

    }


    const fetchProductsAndFilters = async () => {
        
        try{
            
            // if(returnChosenVehicle() == '') return 
            // alert(33)

            setIsLoading(true) 

            // let selectedFiltersString = JSON.stringify(selectedFilters)

            // let presets = encodeURIComponent(JSON.stringify({collectionID, searchQuery, wheelAndTireSpecsArr}))

            // let endpointWithFilters = `${endpoint}?presets=${presets}&selectedFilters=${encodeURIComponent(selectedFiltersString)}`;
            
            const response = await fetch(`${endpoint}/api/1storefront/products-and-filters`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    presets: { collectionID, searchQuery, vehicle: returnChosenVehicle() },
                    selectedFilters
                })
            });
            

            const responseJSON = await response.json()

            setProductsAndFilters((prev) => ({
                products: responseJSON.products || [],
                totalResults: responseJSON.total || 0,
                attribute_filters:responseJSON.filters || []
              }));
            
            setIsLoading(false)
            
            // setTimeout(() => {
            //     scrollToElementTopById("product-grid-and-filters")
            // }, 100);
            
        }catch(error){
            toast(error.message)
            console.log(error)
        }finally{
            setIsLoading(false)
        }

    }


    function refreshVehicle(){
        const selectedVehicles =    JSON.parse(localStorage.getItem("ymm_history") || "[]");
        
        setDisplayYMMwidget(selectedVehicles.length == 0)

        setHasVehicleBeenSelected(selectedVehicles.length > 0)

            const chosen =
        selectedVehicles.find((v) => v.selectedFlag) ||
        selectedVehicles.sort((a, b) => b.timestamp - a.timestamp)[0];

        setSelectedVehicle(chosen)

    }

    function returnChosenVehicle(){


        const selectedVehicles =    JSON.parse(localStorage.getItem("ymm_history") || "[]");
        
 
        if(selectedVehicles.length == 0 )return ''

            const chosen =
        selectedVehicles.find((v) => v.selectedFlag) ||
        selectedVehicles.sort((a, b) => b.timestamp - a.timestamp)[0];

        return chosen 

    }

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${endpoint}/api/1storefront/categories`);
      const data = await res.json();

      if (data.success && Array.isArray(data.categories)) {
        setCategoriesFlat(data.categories)
        const tree = buildCategoryTree(data.categories);
        setFullCategoryTree(tree);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  fetchCategories();
}, []);



    useEffect(() => {

        
        refreshVehicle()
            

    }, [])

    useEffect(()=>{

        setIsLoading(true)
        fetchProductsAndFilters()

    }, [selectedFilters])

    const handlePaginationClick = (newPage) => {

        scrollToElementTopById("product-grid-and-filters")

        setSelectedFilters(prev => ({
          ...prev,
          page: newPage
        }));

    };


    const handleAttributesClick = (newAttributes) => {
        scrollToElementTopById("product-grid-and-filters")

        setSelectedFilters(prev => ({
          ...prev,
          page: 1,
          attributes: newAttributes
        }));

    }

    const handleSortByChange = (newValue) => {
        setSelectedFilters(prev => ({
          ...prev,
          page: 1,
          sort_by: newValue
        }));
    }
    
    const handleClearAllFilters = () => {

        //localStorage.setItem('garage_vehicle', JSON.stringify([]));

        // window.location.reload();

        setSelectedFilters(prev => ({
          ...prev,
          page: 1,
          sort_by: '',
          price: {},
          query: '',
          attributes: []
        }));
    }
    function notifyVehicleChange() {
        window.dispatchEvent(
            new CustomEvent("ymm-vehicle-changed-from-listing-pages", {
            
            })
        );
    }

    const ymmSelectedCallback = () =>  {
        // alert(1)
        fetchProductsWithVehicleContext()
        refreshVehicle()
        notifyVehicleChange()
    }


    const clearVehicle = () => {

        localStorage.removeItem("ymm_history");
        
        setTimeout(() => {
            setDisplayYMMwidget(true);
            notifyVehicleChange()
        }, 10);
        
        fetchProductsWithoutVehicleContext()

    }




    return(
        <div style={{marginBottom:'20px', marginTop:'10px' }}>
            
            <div >
            
                {
                    (displayYMMwidget && !disableYMM) 

                        ?             
                            <Box sx={{marginBottom:'40px', display: isLoading ?'none': 'block'}}>
                                <YMMwidget 
                                    endpoint={endpoint}
                                    orientation={'horizontal'}
                                    buttonLabel={'Search'}
                                    heading={'SELECT YOUR VEHICLE'}
                                    headingStyles={{color: 'black'}}
                                    callback={ymmSelectedCallback}
                                    selectDisabledOpacity={0.6}
                                    
                                    containerStyles={{
                                        background: 'white',                                        
                                        boxShadow: '0 8px 24px rgba(11,51,160,0.3)',  
                                        padding: {xs: '15px', md:'15px 40px 30px 40px'} 
                                    }}
                                />
                            </Box>
                        : <></>
                }

                {
                    (!displayYMMwidget && hasVehicleBeenSelected && !disableYMM) ? (
                        // <Box  sx={{
                        //         textAlign:'center', 
                        //         display: 'flex',
                        //         // maxWidth:'600px',
                        //         boxShadow: '0 8px 24px rgba(11,51,160,0.3)',  
                        //         background: 'white',
                        //         justifyContent:'center', 
                        //         marginBottom:'8px', 
                        //         padding: { xs:'15px', md: 'none' } 
                        //     }}
                        // >
                            <Stack
                                direction={{ xs: "column", md: "row" }}
                                spacing={{xs: 1, md: 3}}
                                alignItems="center"
                                sx={{
                                        boxShadow: '0 8px 24px rgba(11,51,160,0.06)',  
                                        padding: {xs: '15px', md:'20px 40px'},
                                        background:'white',
                                        boxSizing:'border-box',
                                        margin: '10px auto',
                                        marginBottom:'30px',
                                        display: {xs:'flex', md:'none'},
                                        width: {xs:'100%', md: 'fit-content'} 
                                }}
                            >
                                <Typography variant={'h6'} fontWeight={'bold'}>
                                    {selectedVehicle?.fullObj?.years?.label}{" "}
                                    {selectedVehicle?.fullObj?.makes?.label}{" "}
                                    {selectedVehicle?.fullObj?.models?.label}{" "}
                                </Typography>

                                        <div
                                            style={{display:'flex', gap: '20px', alignItems:'center'}}
                                        >


                                                <Button
                                                    variant="outlined"
                                                    color='black'
                                                    hoverBackgroundColor='rgba(0,0,0,0.05)'
                                                    sx={{
                                                        borderRadius: 0,
                                                        color:"black",
                                                        background: "white",
                                                        border: '1px solid rgba(11,51,160,0.3) '
                                                        // paddingBottom: "9px",
                                                        // padding: 0,
                                                    }}
                                                    onClick={() => setDisplayYMMwidget(true)}
                                                >
                                                    Change Vehicle
                                                </Button>

                                                <Button
                                                    variant="outlined"
                                                    hoverBackgroundColor="transparent"

                                                    sx={{
                                                        borderRadius: 0,
                                                        background: "transparent",
                                                        // border: '1px solid red',
                                                        color: 'red',
                                                        borderTop: "none",
                                                        borderRight: 'none',
                                                        borderLeft: 'none',
                                                        borderBottom: "1px solid red",
                                                        paddingBottom: "5px",
                                                        padding: 0,
                                                        height: 'fit-content',
                                                        fontWeight: 400,
                                                        
                                                    }}
                                                    onClick={() => clearVehicle()}
                                                >
                                                    Clear
                                                </Button>

                                        </div>





                            </Stack>
                        // </Box>
                    ) : null
                }


            </div>





            {
                (productsAndFilters && productsAndFilters.products.length > 0) && (
                    <Box
                        sx={{
                            position:'fixed', 
                            bottom:'50px',
                            right:'30px',
                            zIndex:44, 
                        }}
                    >
                        <Button
                        
                        startDecorator={<KeyboardArrowUpIcon sx={{marginLeft:'0px'}} fontSize={'medium'} />}
                        sx={{
                            width:'50px', 
                            height:'50px', 
                            backgroundColor:'black',
                            display:'flex',
                            justifyContent:'center',
                            borderRadius:'50%', 
                        }}

                        onClick={() => {
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth"
                            });
                        }}
                    ></Button>

                    </Box>
            
                )
            }


            {
                isLoading && (<LoadingSpinner />)
            }
            
            {
                (productsAndFilters && productsAndFilters.products.length > 0) && (
                    <Grid  id="product-grid-and-filters" container spacing={5} >
                        {
                            <>
                                <Grid sx={{display: {xs: 'none', md:'block'}}} item size={{ xs: 12, md: 3 }}>
                                    {
                                        productsAndFilters.products.length > 0 && (
                                            <Stack direction={'row'}  sx={{
                                                display:'block',
                                                // paddingLeft:'20px',
                                                alignItems:'center',
                                                // marginBottom:'10px',
                                                justifyContent:((Object.values(selectedFilters.attributes).length > 0) || selectedFilters.query.length > 0 ) ? 'space-between' : 'center'
                                            }}>
                                                <Typography style={{textAlign:'left', fontWeight:'bold', fontSize:'20px', marginBottom:'0px'}}>FILTERS</Typography>
                                            </Stack>
                                        )
                                    }
                                    {/* <div className='ymm-widget-wrapper container' id="ymm-widget"></div> */}
                                    {
                                        ((Object.values(selectedFilters.attributes).length > 0) || selectedFilters.query.length > 0 ) > 0 && (
                                            <Paper elevation={0} sx={{padding:'10px'}}>
                                                <div style={{display:'flex', marginTop:'10px', flexWrap:'wrap', gap:'10px'}}>
                                                    {
                                                        selectedFilters.attributes.
                                                        filter(({key}) => key != "Categories")
                                                        .flatMap((attr) =>
                                                            attr.values.map((value, index) => (
                                                                <Chip
                                                                    key={`${attr.key}-${value}`}
                                                                    label={`${attr.label}: ${value}`}
                                                                    variant="outlined"
                                                                />
                                                            ))
                                                        )
                                                    }

                                                    {
                                                        selectedFilters.attributes.
                                                        filter(({key}) => key == "Categories")
                                                        .flatMap((attr) =>
                                                            attr.values.map((value, index) => (
                                                                <Chip
                                                                    sx={{maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis'}}
                                                                    key={`${attr.key}-${value}`}
                                                                    label={`${attr.label}: ${categoriesFlat.find(c => c.id.toString() == value.toString())?.name || value }`}
                                                                    variant="outlined"
                                                                />
                                                            ))
                                                        )
                                                    }



                                                    {
                                                        selectedFilters.query.length > 0 && (
                                                           <Chip
                                                                    label={`query: ${selectedFilters.query}`}
                                                                    variant="outlined"
                                                                /> 
                                                        )
                                                    }


<Chip
                                                                                    onClick={handleClearAllFilters}
                                                                                    label={`Clear All Filters`}
                                                                                    variant={'filled'}
                                                                                    color={'error'}
                                                                                /> 

                                                    
                                                </div>
                                            </Paper>
                                        )
                                    }
                                    
                                    <div style={{marginTop:'17px'}}>
                                        
                                        <ProductFilters
                                            selectedVehicle={selectedVehicle} 
                                            fullCategoryTree={fullCategoryTree}
                                            handleSearch={handleQuery}
                                            collectionID={collectionID}
                                            factorySizesInKeyVsArrayForm={[]}
                                            productFilters={productsAndFilters.attribute_filters} 
                                            selectedFilters={selectedFilters}
                                            handleAttributesClick={handleAttributesClick}
                                        />
                                    </div>

                                </Grid>

                                <Grid item size={{ xs: 12, md: 9 }}>

                                    <Paper sx={{
                                        background:'transparent',
                                        // paddingRight:'20px',
                                        marginBottom:'30px'

                                        }} 
                                        elevation={0}
                                    >
                                        <Stack direction={window.innerWidth < 600 ? 'row-reverse': 'row'} sx={
                                                {
                                                    marginBottom:'10px',
                                                    display:'flex',
                                                    alignItems:'center',
                                                    background:'transparent',
                                                    zIndex:12,
                                                    flexDirection: {xs:'row-reverse', md:'row'},
                                                    justifyContent:'space-between'
                                                }
                                            }
                                        >
                                            <Typography
                                                sx={{fontSize:'14px', fontWeight:'bold',display: {xs:'none',  md:'block'}}}
                                            >
                                                {productsAndFilters.totalResults}{productsAndFilters.totalResults == 10000 ? '+': ''} Products
                                            </Typography>
                                            <Box
                                                sx={{display: {xs:'flex', md:'none'}}}
                                            >
                                                <FilterDrawer  
                                                    scrollToElementTopById={() => scrollToElementTopById() }
                                                    filtersSelected={((Object.values(selectedFilters.attributes).length > 0) || selectedFilters.query.length > 0 ) }
                                                    appliedFilters={
                                                        <>
                                                            {
                                                                ((Object.values(selectedFilters.attributes).length > 0) || selectedFilters.query.length > 0 ) && (
                                                                    <Paper elevation={0} sx={{padding:'10px'}}>
                                                                        <div style={{display:'flex', flexWrap:'wrap', gap:'10px'}}>
                                                    {
                                                        selectedFilters.attributes.
                                                        filter(({key}) => key != "Categories")
                                                        .flatMap((attr) =>
                                                            attr.values.map((value, index) => (
                                                                <Chip
                                                                    key={`${attr.key}-${value}`}
                                                                    label={`${attr.label}: ${value}`}
                                                                    variant="outlined"
                                                                />
                                                            ))
                                                        )
                                                    }

                                                    {
                                                        selectedFilters.attributes.
                                                        filter(({key}) => key == "Categories")
                                                        .flatMap((attr) =>
                                                            attr.values.map((value, index) => (
                                                                <Chip
                                                                    sx={{maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis'}}
                                                                    key={`${attr.key}-${value}`}
                                                                    label={`${attr.label}: ${categoriesFlat.find(c => c.id.toString() == value.toString())?.name || value }`}
                                                                    variant="outlined"
                                                                />
                                                            ))
                                                        )
                                                    }
                                                                            {
                                                                                selectedFilters.query.length > 0 && (
                                                                                <Chip
                                                                                            label={`query: ${selectedFilters.query}`}
                                                                                            variant="outlined"
                                                                                        /> 
                                                                                )
                                                                            }

 <Chip
                                                                                    onClick={handleClearAllFilters}
                                                                                    label={`Clear All Filters`}
                                                                                    variant={'filled'}
                                                                                    color={'error'}
                                                                                /> 

                                                                        </div>
                                                                    </Paper>
                                                                )
                                                            }
                                                        </>
                                                    }
                                                    uiComponent={
                                                        <>
                                                            <ProductFilters 
                                                                selectedVehicle={selectedVehicle}
                                                                fullCategoryTree={fullCategoryTree}
                                                                handleSearch={handleQuery}
                                                                collectionID={collectionID}
                                                                factorySizesInKeyVsArrayForm={[]}
                                                                productFilters={productsAndFilters.attribute_filters} 
                                                                selectedFilters={selectedFilters}
                                                                handleAttributesClick={handleAttributesClick}
                                                            />
                                                        </>
                                                    }
                                                />
                                            </Box>

                                            {
                                                (!displayYMMwidget && hasVehicleBeenSelected && !disableYMM) ? (

              <Stack
                                                direction={{ xs: "column", md: "row" }}
                                                spacing={{ xs: 1, md: 3 }}
                                                alignItems="center"
                                                sx={{ display: { xs: "none", md: "flex" } }}
                                                divider={
                                                    <Divider
                                                        orientation="vertical"
                                                        flexItem
                                                        sx={{  
                                                            borderColor: "rgba(11,51,160,0.3)" }}
                                                    />
                                                }
                                                >
                                                <Typography fontWeight="bold" color='black'>
                                                    {selectedVehicle?.fullObj?.years?.label}{" "}
                                                    {selectedVehicle?.fullObj?.makes?.label}{" "}
                                                    {selectedVehicle?.fullObj?.models?.label}
                                                </Typography>

                                                <Button
                                                    variant="outlined"
                                                    hoverBackgroundColor='rgba(0,0,0,0.05)'
                                                    sx={{
                                                        borderRadius: 0,
                                                        background: "white",
                                                        color:"black",
                                                        border: '1px solid rgba(0,0,0,0.3) '
                                                        // paddingBottom: "9px",
                                                        // padding: 0,
                                                        
                                                    }}
                                                    onClick={() => setDisplayYMMwidget(true)}
                                                >
                                                    Change Vehicle
                                                </Button>

                                                <Button
                                                    variant="outlined"
                                                    hoverBackgroundColor="transparent"

                                                    sx={{
                                                        borderRadius: 0,
                                                        background: "transparent",
                                                        // border: '1px solid red',
                                                        color: 'red',
                                                        borderTop: "none",
                                                        borderRight: 'none',
                                                        borderLeft: 'none',
                                                        borderBottom: "1px solid red",
                                                        paddingBottom: "5px",
                                                        padding: 0,
                                                        fontWeight: 400,
                                                        
                                                    }}
                                                    onClick={() => clearVehicle()}
                                                >
                                                    Clear Vehicle
                                                </Button>

                                            </Stack>
                                                ): null

                                            }
                              


                                            <SortBy 
                                                sort_by={selectedFilters.sort_by}
                                                handleSortByChange={handleSortByChange}
                                            />
                                        </Stack>
                                    </Paper>


                                        {
                                        ((Object.values(selectedFilters.attributes).length > 0) || selectedFilters.query.length > 0 ) && (
                                            <Paper elevation={0} sx={{display: {xs:'block', md:'none'}, padding:'10px', marginBottom: '20px'}}>
                                                <div style={{display:'flex', flexWrap:'wrap', gap:'10px'}}>
                                                    {
                                                        selectedFilters.attributes.
                                                        filter(({key}) => key != "Categories")
                                                        .flatMap((attr) =>
                                                            attr.values.map((value, index) => (
                                                                <Chip
                                                                    key={`${attr.key}-${value}`}
                                                                    label={`${attr.label}: ${value}`}
                                                                    variant="outlined"
                                                                />
                                                            ))
                                                        )
                                                    }

                                                    {
                                                        selectedFilters.attributes.
                                                        filter(({key}) => key == "Categories")
                                                        .flatMap((attr) =>
                                                            attr.values.map((value, index) => (
                                                                <Chip
                                                                    sx={{maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis'}}
                                                                    key={`${attr.key}-${value}`}
                                                                    label={`${attr.label}: ${categoriesFlat.find(c => c.id.toString() == value.toString())?.name || value }`}
                                                                    variant="outlined"
                                                                />
                                                            ))
                                                        )
                                                    }
                                                                    {
                                                                        selectedFilters.query.length > 0 && (
                                                                        <Chip
                                                                                    label={`query: ${selectedFilters.query}`}
                                                                                    variant="outlined"
                                                                                /> 
                                                                        )
                                                                    }
                                                                             <Chip
                                                                                    onClick={handleClearAllFilters}
                                                                                    label={`Clear All Filters`}
                                                                                    variant={'filled'}
                                                                                    color={'error'}
                                                                                /> 
                                                                       
                                                                    
                                                                        

     

                                                </div>
                                            </Paper>
                                        )
                                    }

                                    <ProductGrid products={productsAndFilters.products} />
                                    
                                    <div style={{display:'flex', marginTop:'30px', marginBottom:'20px', justifyContent:'center'}}>
                                        <PaginationWithMUI 
                                            totalProducts={productsAndFilters.totalResults} 
                                            productsPerPage={36}
                                            handlePaginationClick={handlePaginationClick}
                                            currentPage={selectedFilters.page}
                                        />
                                    </div>
                                       
                                </Grid>
                            </>
                        }
                    </Grid>
                )
            }
            
            {
                ( !isLoading && productsAndFilters &&  productsAndFilters.products.length  == 0 ) && (
                    <Container maxWidth={'sm'}  sx={{ marginTop:'20px'}}>
                        {
                            ((Object.values(selectedFilters.attributes).length > 0) || selectedFilters.query.length > 0 ) && (
                                <Paper elevation={0} sx={{padding:'10px', display:'flex', justifyContent:'center',}}>
                                    <div style={{display:'flex', flexWrap:'wrap', gap:'10px'}}>
                                        {
                                            selectedFilters.attributes.flatMap((attr) =>
                                                attr.values.map((value, index) => (
                                                    <Chip
                                                        key={`${attr.key}-${value}`}
                                                        label={`${attr.label}: ${value+generateLabelUnit(attr.key, value)}`}
                                                        variant="outlined"
                                                    />
                                                ))
                                            )
                                        }
                                        {
                                            selectedFilters.query.length > 0 && (
                                            <Chip
                                                        label={`query: ${selectedFilters.query}`}
                                                        variant="outlined"
                                                    /> 
                                            )
                                        }
                                    </div>
                                </Paper>
                            )
                        }
                        {
                                (
                                    selectedVehicle &&
                                    collectionID.trim().length > 0 && 
                                    selectedFilters.query.length > 0 
                                ) ?
                                    <>
                                        <Alert  severity={'info'} sx={{marginTop:'7px', justifyContent:'center', textAlign:'center'}}>
No compatible products were found for your selected vehicle in this category. Please click the button below to view all proudcts in this category.                                    </Alert>
                                        <div style={{marginTop:'20px',display:'flex', justifyContent:'center'}}>
                                            <Button sx={{minHeight: '50px'}} onClick={() => fetchProductsWithoutVehicleContextAndQuery()}>Show All Products in This Category</Button>
                                        </div>
                                    </>
                                :  (
                                    selectedVehicle &&
                                    collectionID.trim().length > 0 
                                 )
                                    ?   <>
                                            <Alert  severity={'info'} sx={{marginTop:'7px', justifyContent:'center', textAlign:'center'}}>
No compatible products were found for your selected vehicle in this category.  Please click the button below to view all proudcts in this category.                                               </Alert>
                                            <div style={{marginTop:'20px',display:'flex', justifyContent:'center'}}>
                                                <Button sx={{minHeight: '50px'}} onClick={() => fetchProductsWithoutVehicleContext()}>Show All Products in This Category</Button>
                                            </div>
                                        </>
                                    : (
                                        selectedVehicle &&
                                        selectedFilters.useSelectedVehicle &&
                                        selectedFilters.query.length > 0 
                                    )
                                        ? <>
                                            <Alert  severity={'info'} sx={{marginTop:'7px', justifyContent:'center', textAlign:'center'}}>
                                              No compatible products were found for your selected vehicle and the query <strong>{selectedFilters.query}</strong>. Please click the button below to view all proudcts matching your query. 
                                            </Alert>
                                            <div style={{marginTop:'20px',display:'flex', justifyContent:'center'}}>
                                                <Button sx={{minHeight: '50px'}} onClick={() => fetchProductsWithoutVehicleContext()}>Show All Products Matching Query</Button>
                                            </div>

                                        </>
                                        : <>
                                            <Alert  severity={'info'} sx={{marginTop:'7px', justifyContent:'center', textAlign:'center'}}>
                                                No products found matching the selected filters. 
                                            </Alert>
                                            {
                                                selectedFilters.attributes.length > 0
                                                 ? (

                                                    <div style={{marginTop:'20px',display:'flex', justifyContent:'center'}}>
                                                        <Button sx={{minHeight: '50px'}} onClick={() => handleClearAllFilters()}>Clear filters</Button>
                                                    </div>
                                                 ) : (

                                                    
                                                    selectedVehicle?.fullObj 
                                                        ? (
                                                   <div style={{marginTop:'20px',display:'flex', justifyContent:'center'}}>
                                                        <Button sx={{minHeight: '50px'}} onClick={() => clearVehicle()}>Clear Selected Vehicle</Button>
                                                    </div>
                                                        ): <></>
                                                    

 

                                                 )
                                            }

                                        </>
                                

                        }
       
                    </Container>
                )
            }

        </div>
    )    
}