export function generateLabelUnit(attributeKey, attributeValue){

    switch(attributeKey){

        case 'wheel_diameter':
        case 'wheel_width':
            return '"'

        case 'wheel_offset':
            return ' mm'
        case 'tire_rim_diameter': 
            return '"'
        case 'section_width':
            if(parseInt(attributeValue) > 100  )
                return " mm"
            else return '"'
        case 'aspect_ratio': 
            if(parseInt(attributeValue) < 20 )
                return '"'
            else 
                return ""
        default:
            return ''
    }
}

export const propsOrderAndLabels = {
"wheel_diameter": "Wheel Diameter",
"wheel_width": "Wheel Width",
"wheel_offset": "Wheel Offset",
"wheel_brand": "Wheel Brand",
"wheel_model": "Wheel Model",
"wheel_material": "Wheel Material",
"wheel_color": "Wheel Color",
"wheel_bolt_patterns": "Wheel Bolt Patterns",
"wheel_weight": "Wheel Weight",
"wheel_hub_bore": "Wheel Hub Bore",
"tire_rim_diameter": "Rim Diamenter",
"section_width": "Tire Width",
"aspect_ratio": "Tire Aspect Ratio",
"brand": "Tire Brand", 
"tire_type": "Tire Type",
"load_index": "Tire Load Index",
"speed_index": "Tire Speed Index",
"model": "Tire Model", 
"weight": "Tire Weight"
}