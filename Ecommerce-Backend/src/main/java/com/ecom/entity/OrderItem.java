package com.ecom.entity;

import jakarta.persistence.*;
import lombok.Data;


@Entity
@Data
@Table(name = "orderitems")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Order order;

    @ManyToOne
    private Product product;

    private Integer quantity;

    private Double price;
}
