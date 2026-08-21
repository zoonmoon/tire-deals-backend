export const allTiresSchema = {
  
  mappings: {
    
    properties: {

      // ===========================
      // Identity
      // ===========================

      size_search: {
        type: "text"
      },

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


status: {
    type: "keyword"
},



// ===========================
// Rebates / Promotions
// ===========================

rebates: {
  type: "nested",
  properties: {

    amount: {
      type: "float"
    },

    description: {
      type: "text"
    },

    description_preview: {
      type: "text"
    },

    qty_required: {
      type: "integer"
    },

    url: {
      type: "keyword"
    },

    preview_img_url: {
      type: "keyword"
    },

    banner_img_url: {
      type: "keyword"
    },

    horizontal_img_url: {
      type: "keyword"
    },

    start_date: {
      type: "date",
      format: "yyyy-MM-dd"
    },

    end_date: {
      type: "date",
      format: "yyyy-MM-dd"
    }
  }
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



export const localInstallersSchema = {
  mappings: {
    properties: {
      // =========================
      // IDENTITY
      // =========================

      id: {
        type: "keyword"
      },

      // =========================
      // SHOP SEARCH
      // =========================

      company_name: {
        type: "text"
      },

      // =========================
      // ADDRESS / ZIP SEARCH
      // =========================

      address_line1: {
        type: "text"
      },

      address_line2: {
        type: "text"
      },

      city: {
        type: "keyword"
      },

      state: {
        type: "keyword"
      },

      zip: {
        type: "keyword"
      },

      // =========================
      // GEO / DISTANCE SEARCH
      // =========================

      location: {
        type: "geo_point"
      },

      // =========================
      // RATING
      // =========================

      rating: {
        type: "float"
      },

      review_count: {
        type: "integer"
      },

      // =========================
      // INSTALLER TYPE / FILTERS
      // =========================

      is_mobile_install: {
        type: "boolean"
      },

      is_certified: {
        type: "boolean"
      },

      is_top_shop: {
        type: "boolean"
      },

      is_sponsored: {
        type: "boolean"
      },

      authorised_installer: {
        type: "boolean"
      },

      // =========================
      // RIM COMPATIBILITY
      // =========================

      min_rim_size: {
        type: "integer"
      },

      max_rim_size: {
        type: "integer"
      },

      // =========================
      // PRODUCT / VEHICLE TYPE
      // =========================

      installer_product_sub_types: {
        type: "keyword"
      },

      // =========================
      // INSTALLATION PRICE
      // =========================

      installation_price: {
        type: "integer"
      },

      installation_sale_price: {
        type: "integer"
      },

      installation_4_tires_sale_price: {
        type: "integer"
      },

      installation_cost_for_4_tires_in_cents: {
        type: "integer"
      },

      saving_cost: {
        type: "integer"
      },

      // =========================
      // EVERYTHING ELSE
      // =========================

      raw: {
        type: "object",
        enabled: false
      }
    }
  }
};

export const rebatesSchema = {
  mappings: {
    properties: {
      // =========================
      // IDENTITY
      // =========================

      id: {
        type: "keyword"
      },

      product_code: {
        type: "keyword"
      },

      brand: {
        type: "keyword"
      },

      pattern: {
        type: "keyword"
      },

      display_name: {
        type: "keyword"
      },

      // =========================
      // NORMALIZED MATCHING
      // =========================

      normalized_product_code: {
        type: "keyword"
      },

      normalized_brand: {
        type: "keyword"
      },

      // =========================
      // REBATE
      // =========================

      amount: {
        type: "scaled_float",
        scaling_factor: 100
      },

      amount_two: {
        type: "scaled_float",
        scaling_factor: 100
      },

      amount_reason: {
        type: "text"
      },

      amount_two_reason: {
        type: "text"
      },

      qty_required: {
        type: "integer"
      },

      description_preview: {
        type: "text"
      },

      // =========================
      // DATES
      // =========================

      start_date: {
        type: "date"
      },

      end_date: {
        type: "date"
      },

      // =========================
      // ASSETS
      // =========================

      form_url: {
        type: "keyword",
        index: false
      },

      preview_image_url: {
        type: "keyword",
        index: false
      },

      banner_image_url: {
        type: "keyword",
        index: false
      },

      horizontal_image_url: {
        type: "keyword",
        index: false
      }
    }
  }
};


export const contactInquiriesSchema = {
  mappings: {
    properties: {
      // =========================
      // IDENTITY
      // =========================

      id: {
        type: "keyword"
      },

      // =========================
      // CONTACT
      // =========================

      name: {
        type: "keyword"
      },

      email: {
        type: "keyword"
      },

      phone: {
        type: "keyword"
      },

      // =========================
      // INQUIRY
      // =========================

      subject: {
        type: "keyword"
      },

      message: {
        type: "text"
      },

      // =========================
      // STATUS
      // =========================

      status: {
        type: "keyword"
      },

      // =========================
      // DATES
      // =========================

      created_at: {
        type: "date"
      },

      is_viewed: {
        type: "boolean"
      }, 

      updated_at: {
        type: "date"
      }
    }
  }
};


export const cartsSchema = {
  mappings: {
    properties: {
      // =========================
      // IDENTITY
      // =========================

      cart_id: {
        type: "keyword"
      },

      customer_id: {
        type: "keyword"
      },

      // =========================
      // DELIVERY
      // =========================

      delivery_method: {
        type: "keyword"
      },

      delivery_location_id: {
        type: "keyword"
      },

      // =========================
      // ITEMS
      // =========================

      items: {
        type: "nested",
        properties: {
          tire_inventory_id: {
            type: "keyword"
          },

          quantity: {
            type: "keyword"
          }
        }
      },

      // =========================
      // DATES
      // =========================

      created_at: {
        type: "date"
      },

      updated_at: {
        type: "date"
      }
    }
  }
};