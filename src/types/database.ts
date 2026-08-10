export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "delivered"
  | "cancelled";

export type OrderMode = "delivery" | "pickup";

export type PaymentMethod = "cash" | "card" | "online";

export type PaymentStatus = "pending" | "paid" | "refunded";

export interface Category {
  id: string;
  slug: string;
  label: string;
  intro: string | null;
  note: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  price_label: string | null;
  weight: string | null;
  volume: string | null;
  is_orderable: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ItemVariant {
  id: string;
  item_id: string;
  label: string;
  price: number;
  sort_order: number;
}

export interface ItemSupplement {
  id: string;
  item_id: string;
  label: string;
  price: number;
  sort_order: number;
}

export interface FixedMenu {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_highlight: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Sauce {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export interface OpeningHour {
  id: string;
  day_of_week: number;
  day_label: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  sort_order: number;
}

export interface DeliveryConfig {
  id: string;
  is_enabled: boolean;
  min_order: number;
  fee: number;
  free_from: number;
  zone_description: string | null;
  zone_radius_km: number;
  zone_center_postal: string;
  estimated_time: string;
  pickup_time: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  mode: OrderMode;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_postal: string | null;
  delivery_city: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  mollie_payment_id: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  prepared_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  estimated_delivery_at: string | null;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  variant_id: string | null;
  name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  created_at: string;
}

export interface OrderItemSupplement {
  id: string;
  order_item_id: string;
  supplement_id: string | null;
  label: string;
  price: number;
}

export interface MenuItemWithRelations extends MenuItem {
  variants: ItemVariant[];
  supplements: ItemSupplement[];
}

export interface CategoryWithItems extends Category {
  menu_items: MenuItemWithRelations[];
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    order_item_supplements: OrderItemSupplement[];
  })[];
}

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Category, "id" | "created_at" | "updated_at">>;
      };
      menu_items: {
        Row: MenuItem;
        Insert: Omit<MenuItem, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<MenuItem, "id" | "created_at" | "updated_at">>;
      };
      item_variants: {
        Row: ItemVariant;
        Insert: Omit<ItemVariant, "id">;
        Update: Partial<Omit<ItemVariant, "id">>;
      };
      item_supplements: {
        Row: ItemSupplement;
        Insert: Omit<ItemSupplement, "id">;
        Update: Partial<Omit<ItemSupplement, "id">>;
      };
      fixed_menus: {
        Row: FixedMenu;
        Insert: Omit<FixedMenu, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<FixedMenu, "id" | "created_at" | "updated_at">>;
      };
      sauces: {
        Row: Sauce;
        Insert: Omit<Sauce, "id">;
        Update: Partial<Omit<Sauce, "id">>;
      };
      opening_hours: {
        Row: OpeningHour;
        Insert: Omit<OpeningHour, "id">;
        Update: Partial<Omit<OpeningHour, "id">>;
      };
      delivery_config: {
        Row: DeliveryConfig;
        Insert: Omit<DeliveryConfig, "id" | "updated_at">;
        Update: Partial<Omit<DeliveryConfig, "id" | "updated_at">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "order_number" | "created_at" | "updated_at">;
        Update: Partial<Omit<Order, "id" | "order_number" | "created_at" | "updated_at">>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id" | "created_at">;
        Update: Partial<Omit<OrderItem, "id" | "created_at">>;
      };
      order_item_supplements: {
        Row: OrderItemSupplement;
        Insert: Omit<OrderItemSupplement, "id">;
        Update: Partial<Omit<OrderItemSupplement, "id">>;
      };
    };
  };
}
