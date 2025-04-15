document.addEventListener('DOMContentLoaded', function() {
    // Delete image functionality
    const deleteButtons = document.querySelectorAll('.delete-btn');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const filename = this.getAttribute('data-filename');
            const fileId = this.getAttribute('data-id');
            
            if (confirm('Are you sure you want to delete this image?')) {
                fetch(`/delete-image/${fileId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Remove the image from the DOM
                        this.closest('.gallery-item').remove();
                        
                        // Show success message or refresh the page
                        alert('Image deleted successfully');
                        // window.location.reload();
                    } else {
                        alert('Error deleting image');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error deleting image');
                });
            }
        });
    });
});