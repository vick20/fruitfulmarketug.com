import {toProductCardData} from '../lib/product/ProductWrapper';
import { ProductCardData } from '../components/product/types/product';
export const mockdata: Record<string, unknown>[] = [
  {
    "id": "prod-001",
    "name": "Fresh Tomatoes",
    "slug": "fresh-tomatoes",
    "description": "Fresh, ripe tomatoes, perfect for sauces, stews and everyday cooking.",
    "basePrice": 4000,
    "categories": [{
      "id": "cat-002",
      "name": "Vegetables",
      "slug": "vegetables"
    }],
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1508913826512-066cf8127860?auto=format&fit=crop&w=900&q=80",
        "alt": "Fresh tomatoes"
      }
    ],
    "variants": [
      {
        "id": "var-001",
        "sku": "TOM-500G",
        "price": 2500,
        "attributes": [
          { "name": "Weight", "value": "500 g" }
        ]
      },
      {
        "id": "var-002",
        "sku": "TOM-1KG",
        "price": 4000,
        "attributes": [
          { "name": "Weight", "value": "1 kg" }
        ]
      }
    ]
  },
  {
    "id": "prod-002",
    "name": "Fresh Avocado",
    "slug": "fresh-avocado",
    "description": "Creamy, nutritious avocados for salads, snacks and meals.",
    "basePrice": 2000,
    "categories":[ {
      "id": "cat-001",
      "name": "Fruits",
      "slug": "fruits"
    }],
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1760445529436-25510c869789?auto=format&fit=crop&w=900&q=80",
        "alt": "Fresh avocado"
      }
    ],
    "variants": [
      {
        "id": "var-003",
        "sku": "AVO-1PC",
        "price": 2000,
        "attributes": [
          { "name": "Quantity", "value": "1 piece" }
        ]
      },
      {
        "id": "var-004",
        "sku": "AVO-3PC",
        "price": 5000,
        "attributes": [
          { "name": "Quantity", "value": "3 pieces" }
        ]
      }
    ]
  },
  {
    "id": "prod-003",
    "name": "Matooke Bananas",
    "slug": "matooke-bananas",
    "description": "Fresh green cooking bananas, ideal for traditional Ugandan meals.",
    "basePrice": 2500,
    "categories": [{
      "id": "cat-001",
      "name": "Fruits",
      "slug": "fruits"
    }],
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1743007361629-ec3c542bc62b?auto=format&fit=crop&w=900&q=80",
        "alt": "Fresh bananas"
      }
    ],
    "variants": [
      {
        "id": "var-005",
        "sku": "MAT-1BUNCH",
        "price": 5000,
        "attributes": [
          { "name": "Unit", "value": "1 bunch" }
        ]
      },
      {
        "id": "var-006",
        "sku": "MAT-1KG",
        "price": 2500,
        "attributes": [
          { "name": "Weight", "value": "1 kg" }
        ]
      }
    ]
  },
  {
    "id": "prod-004",
    "name": "Ripe Mangoes",
    "slug": "ripe-mangoes",
    "description": "Sweet and juicy mangoes, perfect for enjoying fresh or making juice.",
    "basePrice": 1500,
    "categories": [{
      "id": "cat-001",
      "name": "Fruits",
      "slug": "fruits"
    }],
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1524807621076-c7ba046f3f3a?auto=format&fit=crop&w=900&q=80",
        "alt": "Ripe mangoes"
      }
    ],
    "variants": [
      {
        "id": "var-007",
        "sku": "MAN-1PC",
        "price": 1500,
        "attributes": [
          { "name": "Quantity", "value": "1 piece" }
        ]
      },
      {
        "id": "var-008",
        "sku": "MAN-1KG",
        "price": 4000,
        "attributes": [
          { "name": "Weight", "value": "1 kg" }
        ]
      }
    ]
  },
  {
    "id": "prod-005",
    "name": "Fresh Spinach",
    "slug": "fresh-spinach",
    "description": "Fresh leafy greens for healthy meals and vegetable dishes.",
    "basePrice": 1500,
    "categories": [{
      "id": "cat-002",
      "name": "Vegetables",
      "slug": "vegetables"
    }],
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=80",
        "alt": "Fresh spinach leaves"
      }
    ],
    "variants": [
      {
        "id": "var-009",
        "sku": "SPI-1BUNCH",
        "price": 1500,
        "attributes": [
          { "name": "Unit", "value": "1 bunch" }
        ]
      }
    ]
  },
  {
    "id": "prod-006",
    "name": "Fresh Ginger",
    "slug": "fresh-ginger",
    "description": "Aromatic fresh ginger for cooking, tea and natural flavouring.",
    "basePrice": 2000,
    "categories": [{
      "id": "cat-004",
      "name": "Kitchen Essentials",
      "slug": "kitchen-essentials"
    }],
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1567752458426-b62144165409?auto=format&fit=crop&w=900&q=80",
        "alt": "Fresh ginger roots"
      }
    ],
    "variants": [
      {
        "id": "var-010",
        "sku": "GIN-250G",
        "price": 2000,
        "attributes": [
          { "name": "Weight", "value": "250 g" }
        ]
      },
      {
        "id": "var-011",
        "sku": "GIN-500G",
        "price": 3500,
        "attributes": [
          { "name": "Weight", "value": "500 g" }
        ]
      }
    ]
  },
  {
    "id": "prod-007",
    "name": "Fresh Garlic",
    "slug": "fresh-garlic",
    "description": "Quality garlic bulbs for seasoning and everyday cooking.",
    "basePrice": 1000,
    "categories": [{
      "id": "cat-004",
      "name": "Kitchen Essentials",
      "slug": "kitchen-essentials"
    }],
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1567752458426-b62144165409?auto=format&fit=crop&w=900&q=80",
        "alt": "Fresh garlic"
      }
    ],
    "variants": [
      {
        "id": "var-012",
        "sku": "GAR-1BULB",
        "price": 1000,
        "attributes": [
          { "name": "Quantity", "value": "1 bulb" }
        ]
      },
      {
        "id": "var-013",
        "sku": "GAR-250G",
        "price": 2500,
        "attributes": [
          { "name": "Weight", "value": "250 g" }
        ]
      }
    ]
  },
  {
    "id": "prod-008",
    "name": "Fresh Herbs",
    "slug": "fresh-herbs",
    "description": "Fresh leafy herbs to add flavour and freshness to your meals.",
    "basePrice": 1500,
    "categories": [{
      "id": "cat-003",
      "name": "Herbs",
      "slug": "herbs"
    }],
    "images": [
      {
        "url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=900&q=80",
        "alt": "Fresh leafy herbs"
      }
    ],
    "variants": [
      {
        "id": "var-014",
        "sku": "HER-1BUNCH",
        "price": 1500,
        "attributes": [
          { "name": "Unit", "value": "1 bunch" }
        ]
      }
    ]
  }
]

export const mockProducts: ProductCardData[] = mockdata.map((product) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toProductCardData(product as any)
);


