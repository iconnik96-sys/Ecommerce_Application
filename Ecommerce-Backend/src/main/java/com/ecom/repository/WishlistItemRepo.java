package com.ecom.repository;


import com.ecom.entity.Product;
import com.ecom.entity.Wishlist;
import com.ecom.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WishlistItemRepo extends JpaRepository<WishlistItem,Long> {
    WishlistItem findByWishlistAndProduct(
            Wishlist wishlist,
            Product product
    );

    List<WishlistItem> findByWishlist(
            Wishlist wishlist
    );}
