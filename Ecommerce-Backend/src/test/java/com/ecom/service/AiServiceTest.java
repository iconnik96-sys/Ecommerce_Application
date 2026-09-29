package com.ecom.service;

import com.ecom.DTO.ProductResponseDTO;
import com.ecom.entity.Product;
import com.ecom.entity.Review;
import com.ecom.mapper.ProductMapper;
import com.ecom.repository.ProductRepo;
import com.ecom.repository.ReviewRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private ProductRepo productRepo;

    @Mock
    private ReviewRepo reviewRepo;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private AiService aiService;

    private Product product1;
    private Product product2;

    @BeforeEach
    void setUp() {
        product1 = new Product();
        product1.setId(1L);
        product1.setName("Mechanical Keyboard");
        product1.setDescription("Tactile typing switch keyboard");
        product1.setPrice(59.99);
        product1.setCategory("Input Device");
        product1.setStock(25);

        product2 = new Product();
        product2.setId(2L);
        product2.setName("Wireless Mouse");
        product2.setDescription("Ergonomic wireless mouse");
        product2.setPrice(29.99);
        product2.setCategory("Input Device");
        product2.setStock(40);
    }

    @Test
    void testGetRecommendations_Success() {
        when(productRepo.findById(1L)).thenReturn(Optional.of(product1));
        when(productRepo.findByCategoryIgnoreCase("Input Device")).thenReturn(List.of(product1, product2));

        ProductResponseDTO dto2 = new ProductResponseDTO();
        dto2.setId(2L);
        dto2.setName("Wireless Mouse");
        when(productMapper.toDTO(product2)).thenReturn(dto2);

        List<ProductResponseDTO> recs = aiService.getRecommendations(1L);

        assertNotNull(recs);
        assertEquals(1, recs.size());
        assertEquals("Wireless Mouse", recs.get(0).getName());
    }

    @Test
    void testGetRecommendations_ProductNotFound() {
        when(productRepo.findById(99L)).thenReturn(Optional.empty());

        List<ProductResponseDTO> recs = aiService.getRecommendations(99L);

        assertNotNull(recs);
        assertTrue(recs.isEmpty());
    }

    @Test
    void testGetReviewSummary_ReturnsCachedSummary() {
        product1.setReviewSummary("Customers praise the responsive tactile feedback and solid build.");
        when(productRepo.findById(1L)).thenReturn(Optional.of(product1));

        String summary = aiService.getReviewSummary(1L);

        assertEquals("Customers praise the responsive tactile feedback and solid build.", summary);
        verifyNoInteractions(reviewRepo);
    }

    @Test
    void testGetReviewSummary_NoReviewsFallback() {
        when(productRepo.findById(1L)).thenReturn(Optional.of(product1));
        when(reviewRepo.findByProductId(1L)).thenReturn(List.of());

        String summary = aiService.getReviewSummary(1L);

        assertEquals("No reviews yet for this product.", summary);
    }
}
