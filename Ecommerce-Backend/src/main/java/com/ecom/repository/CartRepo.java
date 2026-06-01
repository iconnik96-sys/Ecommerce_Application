package com.ecom.repository;

import com.ecom.entity.Cart;
import com.ecom.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepo extends JpaRepository<Cart, Long> {

    public Cart findByUser(User user);


}
