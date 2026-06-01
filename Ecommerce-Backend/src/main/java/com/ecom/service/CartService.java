package com.ecom.service;

import com.ecom.DTO.CartItemResponseDTO;
import com.ecom.DTO.CartResponseDTO;
import com.ecom.entity.Cart;
import com.ecom.entity.CartItem;
import com.ecom.entity.Product;
import com.ecom.entity.User;
import com.ecom.mapper.CartItemMapper;
import com.ecom.repository.CartItemRepo;
import com.ecom.repository.CartRepo;
import com.ecom.repository.ProductRepo;
import com.ecom.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CartService {

    @Autowired
    private CartItemMapper cartMapper;
    @Autowired
    private CartRepo cartRepo;

    @Autowired
    private CartItemRepo cartItemRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ProductRepo productRepo;

    public void addToCart(Long userId,Long productId,int quantity) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Cart cart = cartRepo.findByUser(user);

        if (cart == null) {
            cart = new Cart();
            cart.setUser(user);
            cart = cartRepo.save(cart);
        }
        CartItem cartItem = cartItemRepo.findByCartAndProduct(cart, product);

        if (cartItem != null) {
            cartItem.setQuantity(cartItem.getQuantity()+ quantity);
        }else {
            cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
        }
        cartItemRepo.save(cartItem);
    }

    public CartResponseDTO getCart(Long userId){
        User user = userRepo.findById(userId)
                .orElseThrow(()->new RuntimeException("User not found"));

        Cart cart = cartRepo.findByUser(user);

        if(cart==null){
            CartResponseDTO emptycart = new CartResponseDTO();
            emptycart.setUserId(userId);
            emptycart.setItems(List.of());
            emptycart.setTotalprice(0);
            return emptycart;
        }

        List<CartItem> cartItems = cartItemRepo.findByCart(cart);


        List<CartItemResponseDTO> itemDTOs = cartItems.stream()
                .map(cartMapper::toDTO)
                .toList();

        double total = cartItems.stream()
                .mapToDouble(i -> i.getProduct().getPrice() * i.getQuantity())
                .sum();

        CartResponseDTO response = new CartResponseDTO();
        response.setCartId(cart.getId());
        response.setUserId(userId);
        response.setItems(itemDTOs);
        response.setTotalprice(total);

        return response;
    }
}
