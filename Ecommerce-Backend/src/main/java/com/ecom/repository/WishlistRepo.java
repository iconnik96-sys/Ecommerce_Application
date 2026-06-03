package com.ecom.repository;

import com.ecom.entity.User;
import com.ecom.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistRepo extends JpaRepository<Wishlist,Long> {

    Wishlist findByUser(User user);
}
