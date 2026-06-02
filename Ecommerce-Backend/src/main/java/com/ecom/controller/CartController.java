package com.ecom.controller;

import com.ecom.DTO.CartResponseDTO;
import com.ecom.DTO.UpdateQuantityRequestDTO;
import com.ecom.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/ecom/cart")
public class CartController {
    @Autowired
    private CartService cartService;


    @PostMapping("/addProduct")
    public String addToCart(@RequestParam Long userId,
                            @RequestParam Long productId,
                            @RequestParam int quantity){
          cartService.addToCart(userId,productId,quantity);
          return "cart added";
    }

    @GetMapping("/viewcart/{userId}")
    public CartResponseDTO getCart(@PathVariable Long userId){
        return cartService.getCart(userId);
    }

    @PutMapping("/updateQuantity")
    public CartResponseDTO updateQuantity(@RequestBody UpdateQuantityRequestDTO request){
        return cartService.updateQuantity(request);
    }

}
