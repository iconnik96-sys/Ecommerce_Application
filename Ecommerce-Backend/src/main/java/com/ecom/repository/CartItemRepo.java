package com.ecom.repository;

import com.ecom.entity.Cart;
import com.ecom.entity.CartItem;
import com.ecom.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CartItemRepo extends JpaRepository<CartItem,Long> {
    public CartItem findByCartAndProduct(Cart cart, Product product);
    List<CartItem> findByCart(Cart cart);
}
