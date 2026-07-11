import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CheckboxesForAttributeValues } from './checkbox_attr_values';
import { Box } from '@mui/material';
import SearchBar from './search_bar';
import CategoryFilters from './categories_tree';

export default function ProductFilters({handleSearch, selectedVehicle, fullCategoryTree, collectionID, productFilters, handleAttributesClick, selectedFilters }) {

    console.log("fullCategoryTree", fullCategoryTree)

    const selectedAttrKeysVsValues = selectedFilters.attributes.reduce((acc, curr) => {
        acc[curr.key] = curr.values;
        return acc;
    }, {});
    
    const handleAttributeItemClick = (key, label, value) => {
        let updatedAttributes = [...selectedFilters.attributes];
        const attrIndex = updatedAttributes.findIndex(attr => attr.key === key);

        if (attrIndex > -1) {
            const valuesSet = new Set(updatedAttributes[attrIndex].values);
            if (valuesSet.has(value)) valuesSet.delete(value);
            else valuesSet.add(value);

            const newValues = Array.from(valuesSet);
            if (newValues.length === 0) updatedAttributes.splice(attrIndex, 1);
            else updatedAttributes[attrIndex].values = newValues;
        } else {
            updatedAttributes.push({ key, label, values: [value] });
        }
        
        handleAttributesClick(updatedAttributes);
    };

    return (
        <div style={{paddingBottom:'80px'}}>
            {/* {
                collectionID?.toString()?.includes('514642182458') 
                ? <div style={{textAlign:'center'}}>
                    <img style={{alignSelf:'center'}} src="https://cdn.shopify.com/s/files/1/0956/4930/0794/files/arkon-tire-size_1.webp?v=1762276571" width={'90%'} height={'auto'} />
                </div>
                : <></>
            } */}
            {
                <SearchBar 
                    prevValue={selectedFilters.query}
                    handleSearch={handleSearch}
                />
            }
            
            {  productFilters
            .filter((attribute) => !(selectedVehicle && ( attribute.key == "Make" || attribute.key == "Model" || attribute.key == "Year" ) ))
            .map((attribute, index) => (
                (attribute.options.length > 1 || attribute.key in selectedAttrKeysVsValues ) ?
                <Accordion  key={index}  defaultExpanded={attribute.key in selectedAttrKeysVsValues || index < 1} elevation={0}
                    sx={{
                        paddingTop:'5px',
                        paddingBottom:'5px',
                        borderTop:'1px solid rgba(0,0,0,0.01) !important',
                        "&.Mui-expanded": {
                            //   backgroundColor: "#f0f0f0",
                            //   color: "blue",
                            //   minHeight:'unset!important',
                            //   margin: '0!important',
                            borderTop:'1px solid rgba(0,0,0,0.1)!important',
                            marginTop: '0px!important',
                            marginBottom:'0px!important'
                        }
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`panel-${attribute.key}-content`}
                        id={`for-attribute-${attribute.key}`}
                        sx={{
                            // paddingTop:'10px',
                            // paddingBottom:'10px',
                            "&.Mui-expanded": {
                                minHeight:'unset!important',
                                margin: '0!important',
                                //   paddingTop:'0px',
                                // paddingBottom:'0px',
                            },
                            "& .MuiAccordionSummary-content.Mui-expanded": {
                                margin: "10px 0",
                            }
                        }}
                    >
                        <Typography component="span" sx={{ fontWeight: 'bold', color:'rgb(27, 27, 27)', fontSize:'14px' }}>
                            {attribute.label}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails >
                        {
                            attribute.key == "Categories"
                                ? <CategoryFilters 
                                    handleAttributeItemClick={handleAttributeItemClick}
                                    attributeKey={attribute.key}
                                    collectionID={collectionID}
                                    showCategoriesWithIDs ={attribute.options}
                                    attributeLabel={attribute.label}
                                    categories={fullCategoryTree} 
                                />
                                : <>
                                    <CheckboxesForAttributeValues
                                        attributeValues={attribute.options }
                                        attributeKey={attribute.key}
                                        attributeLabel={attribute.label}
                                        selectedAttributes={selectedFilters.attributes}
                                        handleAttributeItemClick={handleAttributeItemClick}
                                        selectedAttrKeysVsValues={selectedAttrKeysVsValues}
                                        initialVisibleCount={5} // show first 5 by default
                                    />
                                </>
                        }
     

                    </AccordionDetails>
                </Accordion>
                : <div key={index}></div>
            ))}
        </div>
    );
}
