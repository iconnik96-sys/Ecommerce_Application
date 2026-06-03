package com.ecom.service;

import com.ecom.DTO.WishlistResponseDTO;
import com.ecom.entity.Product;
import com.ecom.entity.User;
import com.ecom.entity.Wishlist;
import com.ecom.entity.WishlistItem;
import com.ecom.mapper.WishlistItemMapper;
import com.ecom.mapper.WishlistMapper;
import com.ecom.repository.ProductRepo;
import com.ecom.repository.UserRepo;
import com.ecom.repository.WishlistItemRepo;
import com.ecom.repository.WishlistRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WishlistService {
    @Autowired
    private WishlistRepo  wishlistRepo;

    @Autowired
    private WishlistItemRepo wishlistItemRepo;

    @Autowired
    private WishlistMapper wishlistMapper;
    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private WishlistItemMapper wishlistItemMapper;

    public String addToWishList(Long userId, Long productId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Wishlist wishlist = wishlistRepo.findByUser(user);

        if (wishlist == null) {

            Wishlist newWishlist = new Wishlist();
            newWishlist.setUser(user);

            wishlist = wishlistRepo.save(newWishlist);
        }

        WishlistItem existingItem =
                wishlistItemRepo.findByWishlistAndProduct(
                        wishlist,
                        product
                );

        if (existingItem != null) {
            throw new RuntimeException("Product already exists in wishlist");
        }

        WishlistItem wishlistItem = new WishlistItem();

        wishlistItem.setWishlist(wishlist);
        wishlistItem.setProduct(product);

        wishlistItemRepo.save(wishlistItem);

        return "Product added to wishlist";
    }


    public WishlistResponseDTO getWishlist(Long userId){

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Wishlist wishlist = wishlistRepo.findByUser(user);

        if (wishlist == null) {
            throw new RuntimeException("Wishlist not found");
        }

        List<WishlistItem> items = wishlistItemRepo.findByWishlist(wishlist);

        return wishlistMapper.toDTO(wishlist, items);
    }

    public String removeFromWishlist(Long userId, Long productId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Wishlist wishlist = wishlistRepo.findByUser(user);

        if (wishlist == null) {
            throw new RuntimeException("Wishlist not found");
        }

        WishlistItem wishlistItem =
                wishlistItemRepo.findByWishlistAndProduct(
                        wishlist,
                        product
                );

        if (wishlistItem == null) {
            throw new RuntimeException("Product not found in wishlist");
        }

        wishlistItemRepo.delete(wishlistItem);

        return "Product removed from wishlist";
    }


}
