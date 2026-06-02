package com.ecom.service;

import com.ecom.DTO.OrderResponseDTO;
import com.ecom.entity.*;
import com.ecom.enums.OrderStatus;
import com.ecom.mapper.OrderMapper;
import com.ecom.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private CartRepo cartRepo;

    @Autowired
    private CartItemRepo cartItemRepo;

    @Autowired
    private OrderRepo orderRepo;

    @Autowired
    private OrderMapper orderMapper;

    public OrderResponseDTO placeOrder(Long userId){

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartRepo.findByUser(user);

        if(cart == null){
            throw new RuntimeException("Cart not found");
        }

        List<CartItem> cartItems = cartItemRepo.findByCart(cart);

        if(cartItems.isEmpty()){
            throw new RuntimeException("Cart is empty");
        }

        Order order = new Order();

        order.setUser(user);
        order.setStatus(OrderStatus.PLACED);
        order.setOrderDate(LocalDateTime.now());

        List<OrderItem> orderItems = new ArrayList<>();

        double totalAmount = 0;

        for(CartItem cartItem : cartItems){

            OrderItem orderItem = new OrderItem();

            orderItem.setOrder(order);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());

            double price =
                    cartItem.getProduct().getPrice()
                            * cartItem.getQuantity();

            orderItem.setPrice(price);

            totalAmount += price;

            orderItems.add(orderItem);
        }

        order.setAmount(totalAmount);
        order.setOrderItems(orderItems);

        Order savedOrder = orderRepo.save(order);

        cartItemRepo.deleteAll(cartItems);

        return orderMapper.toDTO(savedOrder);
    }

    public List<OrderResponseDTO> getUserOrders(Long userId){

        List<Order> orders = orderRepo.findByUserId(userId);

        return orders.stream()
                .map(orderMapper::toDTO)
                .collect(Collectors.toList());
    }

    public OrderResponseDTO getOrderById(Long orderId){

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        return orderMapper.toDTO(order);
    }

    public String cancelOrder(Long orderId){

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(OrderStatus.CANCELLED);

        orderRepo.save(order);

        return "Order Cancelled Successfully";
    }
}