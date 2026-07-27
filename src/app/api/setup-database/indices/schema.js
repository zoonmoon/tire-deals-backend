export const allTiresSchema = {
  
  mappings: {
    
    properties: {

      // ===========================
      // Identity
      // ===========================

      uid: {
        type: "keyword"   // OpenSearch _id
      },

      part_number: {
        type: "keyword"
      },

      handle: {
        type: "keyword"
      },

      normalized_brand: {
          type: "keyword"
      },

      normalized_part_number: {
          type: "keyword"
      },


      // ===========================
      // Basic Information
      // ===========================

      brand: {
        type: "keyword"
      },

      model: {
        type: "keyword"
      },

      title: {
        type: "text"
      },

      description: {
        type: "text"
      },


      // ===========================
      // Tire Size
      // ===========================

      size: {
        type: "keyword"
      },

      size_format: {
        type: "keyword"   // M = Metric, F = Flotation, U = Unknown
      },


      // Metric
      section_width: {
        type: "integer"
      },

      aspect_ratio: {
        type: "integer"
      },


      // Flotation
      diameter: {
        type: "scaled_float",
        scaling_factor: 10
      },

      inch_width: {
        type: "scaled_float",
        scaling_factor: 100
      },


      // Common

      rim_diameter: {
        type: "integer"
      },


      // ===========================
      // Physical Dimensions
      // ===========================

      overall_diameter: {
        type: "scaled_float",
        scaling_factor: 100
      },

      overall_width: {
        type: "scaled_float",
        scaling_factor: 100
      },

      weight: {
        type: "scaled_float",
        scaling_factor: 100
      },

      tread_depth: {
        type: "scaled_float",
        scaling_factor: 10
      },


      // ===========================
      // Performance Attributes
      // ===========================

      speed_rating: {
        type: "keyword"
      },

      load_rating: {
        type: "keyword"
      },

      load_range: {
        type: "keyword"
      },

      ply_rating: {
        type: "integer"
      },

      sidewall: {
        type: "keyword"
      },

      run_flat: {
        type: "boolean"
      },

      winter_class: {
        type: "keyword"
      },


      // ===========================
      // Fitment / Classification
      // ===========================

      vehicle_type_tags: {
        type: "keyword"
      },

      segment_tags: {
        type: "keyword"
      },


      // ===========================
      // Images (Raw AutoSync Data)
      // ===========================

      img_url_base: {
        type: "keyword"
      },

      rotation_img_url_base: {
        type: "keyword"
      },

      img_front: {
        type: "keyword"
      },

      img_side1: {
        type: "keyword"
      },

      img_side2: {
        type: "keyword"
      },

      img_thumb: {
        type: "keyword"
      },

      img_angle: {
        type: "keyword"
      },


      // ===========================
      // Extra searchable attributes
      // ===========================

      origin_country: {
        type: "keyword"
      },

      utqg: {
        type: "keyword"
      },




// ===========================
// MySQL Inventory Mapping
// ===========================

is_mysql_mapped: {
    type: "boolean"
},

mysql_id: {
    type: "keyword"
},

price: {
    type: "float"
},

quantity: {
    type: "integer"
},

fet: {
    type: "float"
},


      
      // ===========================
      // Flexible Attributes
      // ===========================

      custom_fields: {
        type: "nested",
        properties: {

          label: {
            type: "keyword"
          },

          value: {
            type: "keyword"
          }

        }
      }

    }
  }
};




export const allVehiclesSchema = {

  mappings: {

    properties: {

      // =====================================
      // Identity
      // =====================================

      id: {
        type: "keyword"
      },

      default_chassis_id: {
        type: "keyword"
      },

      vehicle_key: {
        type: "keyword"
      },

      ymm_key: {
        type: "keyword"
      },



      // =====================================
      // Year Make Model Search
      // =====================================

      year: {
        type: "integer"
      },

      make: {
        type: "keyword"
      },

      model: {
        type: "keyword"
      },

      submodel: {
        type: "keyword"
      },

      type: {
        type: "keyword"
      },

      body: {
        type: "keyword"
      },

      make_model: {
        type: "keyword"
      },



      // =====================================
      // Vehicle Details
      // =====================================

      doors: {
        type: "integer"
      },

      bed: {
        type: "keyword"
      },

      drw: {
        type: "boolean"
      },



      // =====================================
      // Wheel Specifications
      // =====================================

      bolt_circle: {
        type: "scaled_float",
        scaling_factor: 10
      },

      bore: {
        type: "scaled_float",
        scaling_factor: 10
      },

      bore_rear: {
        type: "scaled_float",
        scaling_factor: 10
      },

      lug_count: {
        type: "integer"
      },

      max_wheel_load: {
        type: "integer"
      },

      load_rating: {
        type: "integer"
      },

      load_rating_rear: {
        type: "integer"
      },



      // =====================================
      // Images
      // =====================================

      img_url_base: {
        type: "keyword"
      },

      images: {
        type: "object"
      },



      // =====================================
      // Factory Fitments
      // =====================================

      fitments: {

        type: "nested",

        properties: {

          id: {
            type: "keyword"
          },

          chassis_id: {
            type: "keyword"
          },

          format: {
            type: "keyword"
          },

          name: {
            type: "keyword"
          },



          // ---------- FRONT ----------

          tire_size: {
            type: "keyword"
          },

          section_width: {
            type: "integer"
          },

          aspect_ratio: {
            type: "integer"
          },

          rim_diameter: {
            type: "integer"
          },

          rim_width: {
            type: "scaled_float",
            scaling_factor: 10
          },

          inch_width: {
            type: "scaled_float",
            scaling_factor: 100
          },

          diameter: {
            type: "scaled_float",
            scaling_factor: 10
          },

          speed_rating: {
            type: "keyword"
          },

          offset: {
            type: "scaled_float",
            scaling_factor: 10
          },

          min_offset: {
            type: "scaled_float",
            scaling_factor: 10
          },

          max_offset: {
            type: "scaled_float",
            scaling_factor: 10
          },



          // ---------- REAR ----------

          tire_size_rear: {
            type: "keyword"
          },

          section_width_rear: {
            type: "integer"
          },

          aspect_ratio_rear: {
            type: "integer"
          },

          rim_diameter_rear: {
            type: "integer"
          },

          rim_width_rear: {
            type: "scaled_float",
            scaling_factor: 10
          },

          inch_width_rear: {
            type: "scaled_float",
            scaling_factor: 100
          },

          diameter_rear: {
            type: "scaled_float",
            scaling_factor: 10
          },

          speed_rating_rear: {
            type: "keyword"
          },

          offset_rear: {
            type: "scaled_float",
            scaling_factor: 10
          },

          min_offset_rear: {
            type: "scaled_float",
            scaling_factor: 10
          },

          max_offset_rear: {
            type: "scaled_float",
            scaling_factor: 10
          }

        }

      },



      // =====================================
      // Optional Factory Fitments
      // =====================================

      optional_fitments: {

        type: "nested",

        properties: {

          id: {
            type: "keyword"
          },

          chassis_id: {
            type: "keyword"
          },

          format: {
            type: "keyword"
          },

          tire_size: {
            type: "keyword"
          },

          section_width: {
            type: "integer"
          },

          aspect_ratio: {
            type: "integer"
          },

          rim_diameter: {
            type: "integer"
          },

          rim_width: {
            type: "scaled_float",
            scaling_factor: 10
          },

          inch_width: {
            type: "scaled_float",
            scaling_factor: 100
          },

          diameter: {
            type: "scaled_float",
            scaling_factor: 10
          },

          speed_rating: {
            type: "keyword"
          },

          offset: {
            type: "scaled_float",
            scaling_factor: 10
          },

          min_offset: {
            type: "scaled_float",
            scaling_factor: 10
          },

          max_offset: {
            type: "scaled_float",
            scaling_factor: 10
          },



          // Rear

          tire_size_rear: {
            type: "keyword"
          },

          section_width_rear: {
            type: "integer"
          },

          aspect_ratio_rear: {
            type: "integer"
          },

          rim_diameter_rear: {
            type: "integer"
          },

          rim_width_rear: {
            type: "scaled_float",
            scaling_factor: 10
          },

          inch_width_rear: {
            type: "scaled_float",
            scaling_factor: 100
          },

          diameter_rear: {
            type: "scaled_float",
            scaling_factor: 10
          },

          speed_rating_rear: {
            type: "keyword"
          },

          offset_rear: {
            type: "scaled_float",
            scaling_factor: 10
          },

          min_offset_rear: {
            type: "scaled_float",
            scaling_factor: 10
          },

          max_offset_rear: {
            type: "scaled_float",
            scaling_factor: 10
          }

        }

      },



      // =====================================
      // Plus Sizes
      // =====================================

      plus_sizes: {

        type: "nested",

        properties: {

          chassis_id: {
            type: "keyword"
          },

          type: {
            type: "keyword"
          },

          format: {
            type: "keyword"
          },

          tire_size: {
            type: "keyword"
          },

          section_width: {
            type: "integer"
          },

          aspect_ratio: {
            type: "integer"
          },

          rim_diameter: {
            type: "integer"
          },

          rim_width: {
            type: "scaled_float",
            scaling_factor: 10
          },

          inch_width: {
            type: "scaled_float",
            scaling_factor: 100
          },

          diameter: {
            type: "scaled_float",
            scaling_factor: 10
          },

          min_offset: {
            type: "scaled_float",
            scaling_factor: 10
          },

          max_offset: {
            type: "scaled_float",
            scaling_factor: 10
          },

          notes: {
            type: "keyword"
          }

        }

      },



      // =====================================
      // Vehicle Flags
      // =====================================

      race_tires: {
        type: "boolean"
      },

      staggered: {
        type: "boolean"
      },

      staggered_diameter: {
        type: "boolean"
      },

      staggered_width: {
        type: "boolean"
      }

    }

  }

};



      
export const categoriesSchema = {
        mappings: {
          properties: {
            bigcommerce_id: { type: "keyword" },
            bigcommerce_parent_id: { type: "keyword" },
            is_visible: { type: "boolean" },
            name: {type: "keyword"},
            image_url: {type: "keyword"},
            sort_order: {type: "integer"},
            url: {type: "text"}
          },
        },
      }

export const fitmentDataSchema = {
  mappings: {
    properties: {
      id: { type: "keyword" },
      
      product_id: {type: "keyword"},

      year: { type: "integer" },

      make: { type: "keyword" },
      model: { type: "keyword" },
      vehicle_type: { type: "keyword" },
      
      notes: { type: "text" }
    }
  }
};

export const turn14FitmentDataSchema = {
  mappings: {
    properties: {
      item_id: { type: "keyword" },
      t14_part_number: {type: "keyword"},
      mfr_part_number: { type: "keyword" },
      brand: { type: "keyword" },
      fitment_info: { type: "text" }
    }
  }
};

export const makeModelVehicleTypeSchema = {
  mappings: {
    properties: {
      make: { type: "keyword" },
      model: {type: "keyword"},
      vehicle_type: { type: "keyword" },
    }
  }
};

export const sparkShippingProductsSchema = {
  mappings: {
    properties: {
      id: { type: "keyword" },
      wps_item_id: { "type": "keyword" },
      last_updated_at: { "type": "date" },
      vendor_skus_count: { "type": "integer" },
      vendor_skus: {
        "type": "nested",
        "properties": {
          "brand": { "type": "keyword" },
          "vendor_name": { "type": "keyword" },
          "vendor_sku": { "type": "keyword" },
          "vendor_sku": { "type": "keyword" },
          "vendor_part_number": { "type": "keyword" },
        }
      }, 
    }
  }
}
export const wpsBrandsSchema = {
  mappings: {
    properties: {
      brand_id: { type: "keyword" },
      brand_name: { "type": "keyword" }
    }
  }
}