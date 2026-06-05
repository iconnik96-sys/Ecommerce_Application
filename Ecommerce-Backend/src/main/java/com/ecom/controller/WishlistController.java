package com.ecom.controller;

import com.ecom.DTO.WishlistResponseDTO;
import com.ecom.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wishlist")
@CrossOrigin(origins = "*")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @PostMapping("/add/{userId}/{productId}")
    public String addToWishlist(
            @PathVariable Long userId,
            @PathVariable Long productId) {

        return wishlistService.addToWishList(userId, productId);
    }

    @GetMapping("/{userId}")
    public WishlistResponseDTO getWishlist(
            @PathVariable Long userId) {

        return wishlistService.getWishlist(userId);
    }

    @DeleteMapping("/remove/{userId}/{productId}")
    public String removeFromWishlist(
            @PathVariable Long userId,
            @PathVariable Long productId) {

        return wishlistService.removeFromWishlist(userId, productId);
    }
}