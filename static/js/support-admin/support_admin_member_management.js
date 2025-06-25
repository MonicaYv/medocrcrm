
        // Function to open the modal
        function openModal() {
            document.getElementById('addMemberModal').classList.remove('hidden');
        }
    
        // Function to close the modal
        function closeModal() {
            document.getElementById('addMemberModal').classList.add('hidden');
        }
    
        // Function to show the success message
        function showSuccessMessage() {
            document.getElementById('successMessage').classList.remove('hidden');
        }
    
        // Function to close the success message
        function closeSuccessMessage() {
            document.getElementById('successMessage').classList.add('hidden');
        }
    
        // Function to handle Add Member button click
        function addMember() {
            // You can add any logic here for adding the member (e.g., validation or API call)
            
            // Close the Add Member modal
            closeModal();
    
            // Show success message
            showSuccessMessage();
    
            // Optionally clear the input fields
            document.getElementById('memberName').value = '';
            document.getElementById('memberEmail').value = '';
        }
    