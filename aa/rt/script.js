/* Update the header container styles */
.gamer-header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    flex-wrap: wrap;
}

/* Add these media queries for responsive design */
@media (max-width: 992px) {
    .running-text-container {
        order: 3;
        width: 100%;
        margin: 10px 0 0;
    }
    
    .gamer-nav {
        order: 2;
    }
}

@media (max-width: 768px) {
    .running-text-container {
        height: 30px;
        font-size: 0.8rem;
    }
    
    .gamer-nav {
        top: 100px;
    }
}
