package com.ecom.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "wishlist_items")
public class WishlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long WishListId;

    @ManyToOne
    private Wishlist wishlist;

    @OneToOne
    private Product product;
}

